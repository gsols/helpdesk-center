package com.helpdeskcenter.services;

import com.helpdeskcenter.dto.LoginResponse;
import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.repositories.UserRepository;
import com.helpdeskcenter.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public LoginResponse login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
            .filter(u -> passwordEncoder.matches(rawPassword, u.getPasswordHash()))
            .orElse(null);

        if (user == null) {
            return null;
        }

        String token = jwtProvider.generateToken(user);

        return new LoginResponse(
            token,
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getCompany().getId(),
            user.getDepartment() == null ? null : user.getDepartment().getId(),
            user.getDepartment() == null ? null : user.getDepartment().getName()
        );
    }

    /**
     * Changes the password for the given user after verifying the current password.
     * Returns false if the current password does not match.
     */
    public boolean changePassword(Long userId, String currentRaw, String newRaw) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !passwordEncoder.matches(currentRaw, user.getPasswordHash())) {
            return false;
        }
        user.setPasswordHash(passwordEncoder.encode(newRaw));
        userRepository.save(user);
        return true;
    }
}
