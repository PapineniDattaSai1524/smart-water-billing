package com.smartwater.billing.dto.useradmin;

import com.smartwater.billing.entity.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangeRoleRequest {

    @NotNull(message = "Role is required")
    private Role role;
}
