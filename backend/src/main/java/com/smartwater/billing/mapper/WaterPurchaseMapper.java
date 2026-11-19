package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.purchase.WaterPurchaseResponse;
import com.smartwater.billing.entity.WaterPurchase;
import org.springframework.stereotype.Component;

@Component
public class WaterPurchaseMapper {

    public WaterPurchaseResponse toResponse(WaterPurchase purchase) {
        return WaterPurchaseResponse.builder()
                .id(purchase.getId())
                .apartmentId(purchase.getApartment().getId())
                .apartmentName(purchase.getApartment().getName())
                .sourceType(purchase.getSourceType())
                .vendorName(purchase.getVendorName())
                .quantityKl(purchase.getQuantityKl())
                .cost(purchase.getCost())
                .costPerKl(purchase.getCostPerKl())
                .purchaseDate(purchase.getPurchaseDate())
                .invoiceReference(purchase.getInvoiceReference())
                .notes(purchase.getNotes())
                .distributed(purchase.isDistributed())
                .distributedAt(purchase.getDistributedAt())
                .createdAt(purchase.getCreatedAt())
                .build();
    }
}
