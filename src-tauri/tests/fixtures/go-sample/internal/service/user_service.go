package service

import "sync"

// User is the domain record exposed by the service layer.
type User struct {
	ID    int
	Name  string
	Email string
}

// UserRepository abstracts the persistence layer.
type UserRepository interface {
	FindAll() []User
	Save(user User) error
}

// UserService holds the in-memory user collection.
type UserService struct {
	mu    sync.Mutex
	users []User
}

// NewUserService seeds the service with a single demo user.
func NewUserService() *UserService {
	return &UserService{
		users: []User{{ID: 1, Name: "Ada", Email: "ada@example.com"}},
	}
}

// ListUsers returns a copy of the current user collection.
func (s *UserService) ListUsers() []User {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]User(nil), s.users...)
}

// Refresh rebuilds the internal cache.
func (s *UserService) Refresh() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.users = append(s.users, User{ID: len(s.users) + 1, Name: "Grace"})
}
