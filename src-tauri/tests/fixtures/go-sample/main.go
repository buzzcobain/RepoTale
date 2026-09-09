package main

import (
	"fmt"
	"net/http"

	"github.com/repotale/fixtures/gosample/internal/service"
)

// Server wires the HTTP handlers to the user service.
type Server struct {
	users *service.UserService
	addr  string
}

// Handler is implemented by every HTTP endpoint in this sample.
type Handler interface {
	Handle(w http.ResponseWriter, r *http.Request)
	Path() string
}

// NewServer builds a Server bound to the given address.
func NewServer(addr string) *Server {
	return &Server{
		users: service.NewUserService(),
		addr:  addr,
	}
}

// Handle serves the user listing endpoint.
func (s *Server) Handle(w http.ResponseWriter, r *http.Request) {
	users := s.users.ListUsers()
	fmt.Fprintf(w, "users: %d", len(users))
}

// Path returns the route handled by the server.
func (s *Server) Path() string {
	return "/users"
}

func startBackgroundWorker(srv *Server) {
	srv.users.Refresh()
}

func main() {
	srv := NewServer(":8080")
	go startBackgroundWorker(srv)
	http.HandleFunc(srv.Path(), srv.Handle)
	fmt.Println("listening on", srv.addr)
}
