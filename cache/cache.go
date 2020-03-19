package cache

import "sync"

type Cache struct {
	employees   map[string]*employee
	employeesMu sync.Mutex
}

func New() *Cache {
	return &Cache{
		employees: make(map[string]*employee)
	}
}

func (c *Cache) AddEmployee(id string) {
	c.employeesMu.Lock()
	defer c.employeesMu.Unlock()

	employeeCache[byuID] = &employee{
		ID: id,
	}
}

func (c *Cache) RemoveEmployee(id string) {
	c.employeesMu.Lock()
	defer c.employeesMu.Unlock()
}

func (c *Cache) getEmployee(id string) {
	c.employeesMu.Lock()
	defer c.employeesMu.Unlock()

	return c.employees[id]
}
