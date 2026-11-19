package com.smartwater.billing.service;

import com.smartwater.billing.entity.Household;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.security.CustomUserDetails;
import com.smartwater.billing.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Single source of truth for "can the current user access this household?"
 * (IDOR fix). Previously this check existed only inside
 * {@link InvoicePdfService#generateDownload} for invoice PDFs; several other
 * household-scoped endpoints (water usage logs, household lookup by id) had
 * no equivalent check at all -- any authenticated user, regardless of role
 * or assignment, could read or write another household's data simply by
 * changing the id in the URL/request body.
 *
 * Rule, same as the invoice PDF check: SUPER_ADMIN -> any household.
 * ADMIN -> only households in an apartment they administer.
 * RESIDENT -> only a household they are actively assigned to.
 */
@Component
@RequiredArgsConstructor
public class HouseholdAccessGuard {

    private final ResidentAssignmentRepository residentAssignmentRepository;

    public void assertCanAccess(Household household) {
        CustomUserDetails current = SecurityUtils.getCurrentUser();
        if (current == null) {
            throw new UnauthorizedActionException("Not authenticated.");
        }
        if ("SUPER_ADMIN".equals(current.getRole())) {
            return;
        }
        if ("ADMIN".equals(current.getRole())) {
            Long adminId = household.getApartment().getAdmin() != null
                    ? household.getApartment().getAdmin().getId() : null;
            if (!current.getId().equals(adminId)) {
                throw new UnauthorizedActionException("You do not administer this household's apartment.");
            }
            return;
        }
        boolean isMyHousehold = residentAssignmentRepository
                .findByHouseholdIdAndActiveTrue(household.getId())
                .stream()
                .anyMatch(a -> a.getUser().getId().equals(current.getId()));
        if (!isMyHousehold) {
            throw new UnauthorizedActionException("This household does not belong to you.");
        }
    }
}
