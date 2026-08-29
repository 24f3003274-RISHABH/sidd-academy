import { authRepository, AuthRepository } from './auth.repository.js';
import { BaseRepository } from './base.repository.js';

/**
 * User Repository exports AuthRepository instance and methods for user persistence
 */
export class UserRepository extends AuthRepository {
  constructor() {
    super();
  }
}

export const userRepository = authRepository;
export default userRepository;
