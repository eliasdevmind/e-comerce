// Interface base para Repository Pattern
class IRepository {
  async findById(id) {
    throw new Error('Method not implemented: findById');
  }

  async findAll(filters = {}, pagination = {}) {
    throw new Error('Method not implemented: findAll');
  }

  async create(data) {
    throw new Error('Method not implemented: create');
  }

  async update(id, data) {
    throw new Error('Method not implemented: update');
  }

  async delete(id) {
    throw new Error('Method not implemented: delete');
  }

  async count(filters = {}) {
    throw new Error('Method not implemented: count');
  }

  async exists(id) {
    throw new Error('Method not implemented: exists');
  }
}

module.exports = IRepository;
