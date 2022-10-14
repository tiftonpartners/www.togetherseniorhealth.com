require('dotenv').config();
import testUsers from '../data/test-users.json';

export interface TestUser {
    user_id: string;
    username: string;
    name: string;
    nickname: string;
}
/**
 * Provides test utilities to mock data from auth0
 */
export class TestUserService {
    /**
     * Get test user by ID
     */
    static getTestUserById(userId: string): TestUser | undefined {
        const user = (testUsers as TestUser[]).filter(
            (user) => user.user_id === userId
        );
        return user ? user[0] : undefined;
    }

    /**
     * Get all test users
     */
    static getAllTestUsers(): TestUser[] {
        return testUsers as TestUser[];
    }

    /**
     * Get all test users by username
     */
    static getAllTestUsersByUsername(): {
        [key: string]: TestUser;
    } {
        return (testUsers as TestUser[]).reduce(
            (r, e) => {
                r[e.username] = e;
                return r;
            },
            {} as {
                [key: string]: TestUser;
            }
        );
    }

    /**
     * Get all test instructor users
     */
    static getAllTestInstructorUsers(): TestUser[] {
        const instructors = (testUsers as TestUser[]).filter((user) => {
            return user.username.toLowerCase().startsWith('instructor');
        });
        return instructors as TestUser[];
    }

    /**
     * Get all test instructor users
     */
    static getAllTestInstructorUsersByUsername(): {
        [key: string]: TestUser;
    } {
        const instructors = (testUsers as TestUser[]).filter((user) => {
            return user.username.toLowerCase().startsWith('instructor');
        });
        return instructors.reduce(
            (r, e) => {
                r[e.username] = e;
                return r;
            },
            {} as {
                [key: string]: TestUser;
            }
        );
    }

    /**
     * Get all test participant users (any that are not instructors)
     */
    static getAllTestParticipantUsers(): TestUser[] {
        const participants = (testUsers as TestUser[]).filter((user) => {
            return !user.username.toLowerCase().startsWith('instructor');
        });
        return participants as TestUser[];
    }
}
