package com.proyect.main.modelos.dtos.entrada;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CambiarPasswordDto {
    private String oldPassword;
    private String newPassword;
}
