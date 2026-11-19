package com.smartwater.billing.service;

import com.smartwater.billing.dto.allocation.HouseholdAllocationLine;
import com.smartwater.billing.entity.AllocationBasis;
import com.smartwater.billing.exception.InvalidRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static com.smartwater.billing.service.ConsumptionDistributionEngine.HouseholdInput;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ConsumptionDistributionEngineTest {

    private ConsumptionDistributionEngine engine;

    @BeforeEach
    void setUp() {
        engine = new ConsumptionDistributionEngine();
    }

    @Test
    void allHouseholdsMetered_splitsPurelyByConsumption() {
        List<HouseholdInput> households = List.of(
                new HouseholdInput(1L, "A-101", true, BigDecimal.valueOf(10), BigDecimal.valueOf(1000)),
                new HouseholdInput(2L, "A-102", true, BigDecimal.valueOf(30), BigDecimal.valueOf(1000))
        );

        List<HouseholdAllocationLine> lines = engine.distribute(households, BigDecimal.valueOf(400));

        HouseholdAllocationLine h1 = byId(lines, 1L);
        HouseholdAllocationLine h2 = byId(lines, 2L);

        assertThat(h1.getAllocationBasis()).isEqualTo(AllocationBasis.METERED);
        // 10/40 * 400 = 100
        assertThat(h1.getAllocatedAmount()).isEqualByComparingTo("100.00");
        // 30/40 * 400 = 300
        assertThat(h2.getAllocatedAmount()).isEqualByComparingTo("300.00");
        assertTotalsReconcile(lines, BigDecimal.valueOf(400));
    }

    @Test
    void unmeteredHousehold_estimatedFromMeteredPeerDensity() {
        // Metered peer: 1000 sqft uses 20 KL -> density 0.02 KL/sqft
        // Unmetered household: 500 sqft -> estimated 10 KL
        List<HouseholdInput> households = List.of(
                new HouseholdInput(1L, "A-101", true, BigDecimal.valueOf(20), BigDecimal.valueOf(1000)),
                new HouseholdInput(2L, "A-102", false, null, BigDecimal.valueOf(500))
        );

        List<HouseholdAllocationLine> lines = engine.distribute(households, BigDecimal.valueOf(300));

        HouseholdAllocationLine h2 = byId(lines, 2L);
        assertThat(h2.getAllocationBasis()).isEqualTo(AllocationBasis.AREA_ESTIMATED);
        // weight: density 0.02 * 500 = 10 -> total weight 30 -> share 10/30 * 300 = 100
        assertThat(h2.getAllocatedAmount()).isEqualByComparingTo("100.00");
        assertTotalsReconcile(lines, BigDecimal.valueOf(300));
    }

    @Test
    void noMeteredDataAnywhere_fallsBackToPureAreaSplit() {
        List<HouseholdInput> households = List.of(
                new HouseholdInput(1L, "A-101", false, null, BigDecimal.valueOf(1000)),
                new HouseholdInput(2L, "A-102", false, null, BigDecimal.valueOf(3000))
        );

        List<HouseholdAllocationLine> lines = engine.distribute(households, BigDecimal.valueOf(400));

        HouseholdAllocationLine h1 = byId(lines, 1L);
        HouseholdAllocationLine h2 = byId(lines, 2L);

        assertThat(h1.getAllocationBasis()).isEqualTo(AllocationBasis.AREA_FALLBACK);
        assertThat(h2.getAllocationBasis()).isEqualTo(AllocationBasis.AREA_FALLBACK);
        // 1000/4000 * 400 = 100 ; 3000/4000 * 400 = 300
        assertThat(h1.getAllocatedAmount()).isEqualByComparingTo("100.00");
        assertThat(h2.getAllocatedAmount()).isEqualByComparingTo("300.00");
        assertTotalsReconcile(lines, BigDecimal.valueOf(400));
    }

    @Test
    void hasMeterButNoReadingSubmitted_treatedAsUnmetered() {
        List<HouseholdInput> households = List.of(
                new HouseholdInput(1L, "A-101", true, BigDecimal.valueOf(20), BigDecimal.valueOf(1000)),
                // hasMeter = true but consumptionKl is null: no reading this period
                new HouseholdInput(2L, "A-102", true, null, BigDecimal.valueOf(500))
        );

        List<HouseholdAllocationLine> lines = engine.distribute(households, BigDecimal.valueOf(300));

        assertThat(byId(lines, 2L).getAllocationBasis()).isEqualTo(AllocationBasis.AREA_ESTIMATED);
    }

    @Test
    void roundingRemainderIsAbsorbedByLargestAllocation_totalAlwaysReconciles() {
        // 3-way split of 100 that doesn't divide evenly: 1/3 each
        List<HouseholdInput> households = List.of(
                new HouseholdInput(1L, "A-101", true, BigDecimal.ONE, BigDecimal.valueOf(500)),
                new HouseholdInput(2L, "A-102", true, BigDecimal.ONE, BigDecimal.valueOf(500)),
                new HouseholdInput(3L, "A-103", true, BigDecimal.ONE, BigDecimal.valueOf(500))
        );

        List<HouseholdAllocationLine> lines = engine.distribute(households, BigDecimal.valueOf(100));

        assertTotalsReconcile(lines, BigDecimal.valueOf(100));
    }

    @Test
    void emptyHouseholdList_throwsInvalidRequestException() {
        assertThatThrownBy(() -> engine.distribute(List.of(), BigDecimal.valueOf(100)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void negativeTotalCost_throwsInvalidRequestException() {
        List<HouseholdInput> households = List.of(
                new HouseholdInput(1L, "A-101", true, BigDecimal.ONE, BigDecimal.valueOf(500)));

        assertThatThrownBy(() -> engine.distribute(households, BigDecimal.valueOf(-50)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void zeroTotalCost_distributesZeroToEveryHousehold() {
        List<HouseholdInput> households = List.of(
                new HouseholdInput(1L, "A-101", true, BigDecimal.TEN, BigDecimal.valueOf(500)),
                new HouseholdInput(2L, "A-102", true, BigDecimal.valueOf(5), BigDecimal.valueOf(500)));

        List<HouseholdAllocationLine> lines = engine.distribute(households, BigDecimal.ZERO);

        assertThat(lines).allSatisfy(l -> assertThat(l.getAllocatedAmount()).isEqualByComparingTo("0.00"));
    }

    @Test
    void singleHousehold_getsEntireCost() {
        List<HouseholdInput> households = List.of(
                new HouseholdInput(1L, "A-101", true, BigDecimal.valueOf(15), BigDecimal.valueOf(800)));

        List<HouseholdAllocationLine> lines = engine.distribute(households, BigDecimal.valueOf(500));

        assertThat(lines).hasSize(1);
        assertThat(lines.get(0).getAllocatedAmount()).isEqualByComparingTo("500.00");
        assertThat(lines.get(0).getPercentage()).isEqualByComparingTo("100.0000");
    }

    private HouseholdAllocationLine byId(List<HouseholdAllocationLine> lines, Long id) {
        return lines.stream().filter(l -> l.getHouseholdId().equals(id)).findFirst().orElseThrow();
    }

    private void assertTotalsReconcile(List<HouseholdAllocationLine> lines, BigDecimal expectedTotal) {
        BigDecimal sum = lines.stream()
                .map(HouseholdAllocationLine::getAllocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sum).isEqualByComparingTo(expectedTotal);
    }
}
