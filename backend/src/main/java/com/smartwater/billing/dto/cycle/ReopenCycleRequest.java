package com.smartwater.billing.dto.cycle;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReopenCycleRequest {
    /** Why the cycle is being reopened, for the audit trail. Optional but recommended. */
    private String reason;
}
