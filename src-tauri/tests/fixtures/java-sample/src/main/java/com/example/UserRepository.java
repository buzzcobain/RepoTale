package com.example;

import java.util.List;

import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository {

    List<User> findAll();

    User findById(Long id);
}
