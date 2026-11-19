package com.smartwater.billing.service;

import com.smartwater.billing.dto.billing.BillingBreakdownResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.TariffPlan;
import com.smartwater.billing.entity.TariffTier;
import com.smartwater.billing.exception.InvalidRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TieredBillingCalculatorTest {

    private TieredBillingCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new TieredBillingCalculator();
    }

    private TariffPlan tieredPlan(BigDecimal fixedCharge, BigDecimal taxPercentage,
                                   BigDecimal minCharge, BigDecimal maxCharge) {
        TariffPlan plan = TariffPlan.builder()
                .id(1L)
                .apartment(Apartment.builder().id(1L).name("Test Apartment").build())
                .name("Standard Tiered")
                .ratePerKl(BigDecimal.valueOf(50)) // unused when tiers present
                .fixedCharge(fixedCharge)
                .taxPercentage(taxPercentage)
                .minimumCharge(minCharge)
                .maximumCharge(maxCharge)
                .active(true)
                .build();

        plan.setTiers(List.of(
                TariffTier.builder().tariffPlan(plan).tierOrder(1)
                        .minKl(BigDecimal.ZERO).maxKl(BigDecimal.TEN)
                        .ratePerKl(BigDecimal.valueOf(20)).build(),
                TariffTier.builder().tariffPlan(plan).tierOrder(2)
                        .minKl(BigDecimal.TEN).maxKl(BigDecimal.valueOf(20))
                        .ratePerKl(BigDecimal.valueOf(35)).build(),
                TariffTier.builder().tariffPlan(plan).tierOrder(3)
                        .minKl(BigDecimal.valueOf(20)).maxKl(null)
                        .ratePerKl(BigDecimal.valueOf(50)).build()
        ));
        return plan;
    }

    @Test
    void consumptionEntirelyWithinFirstTier_billsOnlyBaseRate() {
        TariffPlan plan = tieredPlan(BigDecimal.ZERO, BigDecimal.ZERO, null, null);

        BillingBreakdownResponse result = calculator.calculate(plan, BigDecimal.valueOf(8), BigDecimal.ZERO);

        // 8 KL * 20 = 160
        assertThat(result.getBaseCharge()).isEqualByComparingTo("160.00");
        assertThat(result.getTotalBill()).isEqualByComparingTo("160.00");
        assertThat(result.getTierBreakdown()).hasSize(3);
        assertThat(result.getTierBreakdown().get(0).getKlBilledAtTier()).isEqualByComparingTo("8.00");
        assertThat(result.getTierBreakdown().get(1).getKlBilledAtTier()).isEqualByComparingTo("0.00");
        assertThat(result.getTierBreakdown().get(2).getKlBilledAtTier()).isEqualByComparingTo("0.00");
    }

    @Test
    void consumptionSpanningTwoTiers_billsEachPortionAtItsOwnRate() {
        TariffPlan plan = tieredPlan(BigDecimal.ZERO, BigDecimal.ZERO, null, null);

        // 15 KL: 10 KL at tier 1 (20/KL) + 5 KL at tier 2 (35/KL)
        BillingBreakdownResponse result = calculator.calculate(plan, BigDecimal.valueOf(15), BigDecimal.ZERO);

        // 10*20=200, 5*35=175 -> 375 total, never the whole 15 at the top rate
        assertThat(result.getBaseCharge()).isEqualByComparingTo("375.00");
        assertThat(result.getTierBreakdown().get(0).getChargeForTier()).isEqualByComparingTo("200.00");
        assertThat(result.getTierBreakdown().get(1).getChargeForTier()).isEqualByComparingTo("175.00");
        assertThat(result.getTierBreakdown().get(2).getChargeForTier()).isEqualByComparingTo("0.00");
    }

    @Test
    void consumptionAboveTopTier_billsAllThreeBandsAndUnboundedTail() {
        TariffPlan plan = tieredPlan(BigDecimal.ZERO, BigDecimal.ZERO, null, null);

        // 25 KL: 10@20=200, 10@35=350, 5@50=250 -> 800
        BillingBreakdownResponse result = calculator.calculate(plan, BigDecimal.valueOf(25), BigDecimal.ZERO);

        assertThat(result.getBaseCharge()).isEqualByComparingTo("800.00");
        assertThat(result.getTierBreakdown().get(2).getKlBilledAtTier()).isEqualByComparingTo("5.00");
    }

    @Test
    void fixedChargeAndSharedChargeAreAddedBeforeTax() {
        TariffPlan plan = tieredPlan(BigDecimal.valueOf(100), BigDecimal.ZERO, null, null);

        BillingBreakdownResponse result = calculator.calculate(plan, BigDecimal.valueOf(8), BigDecimal.valueOf(50));

        // base 160 + fixed 100 + shared 50 = 310
        assertThat(result.getSubtotal()).isEqualByComparingTo("310.00");
        assertThat(result.getTotalBill()).isEqualByComparingTo("310.00");
    }

    @Test
    void taxIsAppliedToTheFullSubtotal() {
        TariffPlan plan = tieredPlan(BigDecimal.valueOf(100), BigDecimal.valueOf(10), null, null);

        BillingBreakdownResponse result = calculator.calculate(plan, BigDecimal.valueOf(8), BigDecimal.ZERO);

        // subtotal = 160 + 100 = 260; tax = 26.00; total = 286.00
        assertThat(result.getSubtotal()).isEqualByComparingTo("260.00");
        assertThat(result.getTaxAmount()).isEqualByComparingTo("26.00");
        assertThat(result.getTotalBill()).isEqualByComparingTo("286.00");
    }

    @Test
    void minimumChargeRaisesAnUnderweightBill() {
        TariffPlan plan = tieredPlan(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.valueOf(500), null);

        // Actual bill for 1 KL would be 20.00, well under the 500 minimum
        BillingBreakdownResponse result = calculator.calculate(plan, BigDecimal.ONE, BigDecimal.ZERO);

        assertThat(result.getPreClampTotal()).isEqualByComparingTo("20.00");
        assertThat(result.getTotalBill()).isEqualByComparingTo("500.00");
        assertThat(result.isClamped()).isTrue();
    }

    @Test
    void maximumChargeCapsAnOverweightBill() {
        TariffPlan plan = tieredPlan(BigDecimal.ZERO, BigDecimal.ZERO, null, BigDecimal.valueOf(600));

        // 25 KL -> 800.00 uncapped, should clamp to 600
        BillingBreakdownResponse result = calculator.calculate(plan, BigDecimal.valueOf(25), BigDecimal.ZERO);

        assertThat(result.getPreClampTotal()).isEqualByComparingTo("800.00");
        assertThat(result.getTotalBill()).isEqualByComparingTo("600.00");
        assertThat(result.isClamped()).isTrue();
    }

    @Test
    void zeroConsumptionStillChargesFixedChargeAndRespectsMinimum() {
        TariffPlan plan = tieredPlan(BigDecimal.valueOf(50), BigDecimal.ZERO, null, null);

        BillingBreakdownResponse result = calculator.calculate(plan, BigDecimal.ZERO, BigDecimal.ZERO);

        assertThat(result.getBaseCharge()).isEqualByComparingTo("0.00");
        assertThat(result.getTotalBill()).isEqualByComparingTo("50.00");
    }

    @Test
    void negativeConsumptionIsRejected() {
        TariffPlan plan = tieredPlan(BigDecimal.ZERO, BigDecimal.ZERO, null, null);

        assertThatThrownBy(() -> calculator.calculate(plan, BigDecimal.valueOf(-1), BigDecimal.ZERO))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void nonTieredPlanFallsBackToFlatRate() {
        TariffPlan plan = TariffPlan.builder()
                .id(2L)
                .apartment(Apartment.builder().id(1L).name("Test Apartment").build())
                .name("Flat Rate")
                .ratePerKl(BigDecimal.valueOf(30))
                .fixedCharge(BigDecimal.valueOf(20))
                .taxPercentage(BigDecimal.ZERO)
                .active(true)
                .build();
        // No tiers set — isTiered() is false, so flat rate applies.

        BillingBreakdownResponse result = calculator.calculate(plan, BigDecimal.valueOf(12), BigDecimal.ZERO);

        // 12 * 30 + 20 = 380, all at the single flat rate — no tier banding
        assertThat(result.getBaseCharge()).isEqualByComparingTo("360.00");
        assertThat(result.getTotalBill()).isEqualByComparingTo("380.00");
        assertThat(result.getTierBreakdown()).hasSize(1);
    }

    // ---------------- validateTierLadder ----------------

    @Test
    void validateTierLadder_acceptsContiguousAscendingBands() {
        TariffPlan plan = tieredPlan(BigDecimal.ZERO, BigDecimal.ZERO, null, null);

        assertThatCode(() -> calculator.validateTierLadder(plan.getOrderedTiers())).doesNotThrowAnyException();
    }

    @Test
    void validateTierLadder_rejectsGapBetweenTiers() {
        TariffPlan plan = TariffPlan.builder().apartment(Apartment.builder().id(1L).build())
                .name("Bad").ratePerKl(BigDecimal.ONE).fixedCharge(BigDecimal.ZERO).build();
        List<TariffTier> tiers = List.of(
                TariffTier.builder().tariffPlan(plan).tierOrder(1)
                        .minKl(BigDecimal.ZERO).maxKl(BigDecimal.TEN).ratePerKl(BigDecimal.valueOf(20)).build(),
                // gap: should start at 10, starts at 12 instead
                TariffTier.builder().tariffPlan(plan).tierOrder(2)
                        .minKl(BigDecimal.valueOf(12)).maxKl(null).ratePerKl(BigDecimal.valueOf(35)).build()
        );

        assertThatThrownBy(() -> calculator.validateTierLadder(tiers))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("contiguous");
    }

    @Test
    void validateTierLadder_rejectsUnboundedTierThatIsNotLast() {
        TariffPlan plan = TariffPlan.builder().apartment(Apartment.builder().id(1L).build())
                .name("Bad").ratePerKl(BigDecimal.ONE).fixedCharge(BigDecimal.ZERO).build();
        List<TariffTier> tiers = List.of(
                TariffTier.builder().tariffPlan(plan).tierOrder(1)
                        .minKl(BigDecimal.ZERO).maxKl(null).ratePerKl(BigDecimal.valueOf(20)).build(),
                TariffTier.builder().tariffPlan(plan).tierOrder(2)
                        .minKl(BigDecimal.TEN).maxKl(BigDecimal.valueOf(20)).ratePerKl(BigDecimal.valueOf(35)).build()
        );

        assertThatThrownBy(() -> calculator.validateTierLadder(tiers))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("unbounded");
    }

    @Test
    void validateTierLadder_rejectsLastTierThatIsBounded() {
        TariffPlan plan = TariffPlan.builder().apartment(Apartment.builder().id(1L).build())
                .name("Bad").ratePerKl(BigDecimal.ONE).fixedCharge(BigDecimal.ZERO).build();
        List<TariffTier> tiers = List.of(
                TariffTier.builder().tariffPlan(plan).tierOrder(1)
                        .minKl(BigDecimal.ZERO).maxKl(BigDecimal.TEN).ratePerKl(BigDecimal.valueOf(20)).build()
        );

        assertThatThrownBy(() -> calculator.validateTierLadder(tiers))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("unbounded");
    }

    @Test
    void validateTierLadder_emptyListIsValid() {
        assertThatCode(() -> calculator.validateTierLadder(List.of())).doesNotThrowAnyException();
    }
}
