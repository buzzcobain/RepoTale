package com.example;

public record User(Long id, String name, String email) {

    public String displayName() {
        return name + " <" + email + ">";
    }
}
