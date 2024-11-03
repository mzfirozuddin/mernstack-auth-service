import { Repository } from "typeorm";
import { User } from "../entity/User";
import { LimitedUserData, UserData, UserQueryParams } from "../types";
import createHttpError from "http-errors";
import bcrypt from "bcryptjs";

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
    }: UserData) {
        //: check user already register or not
        const user = await this.userRepository.findOne({
            where: { email: email },
        });

        if (user) {
            const err = createHttpError(400, "Email is already exist!");
            throw err;
        }

        //: Hash the password
        const saltRoundes = 10;
        const hashedPassword = await bcrypt.hash(password, saltRoundes);

        try {
            // We have to save and return
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                tenant: tenantId ? { id: tenantId } : undefined,
            });
        } catch (err) {
            const error = createHttpError(
                500,
                "Failed to store the data in the database.",
            );
            throw error;
        }
    }

    async findByEmail(email: string) {
        //: check email is already present in DB or not.
        const user = await this.userRepository.findOne({
            where: { email },
        });

        return user;
    }

    async findByEmailWithPassword(email: string) {
        //: check email is already present in DB or not.
        const user = await this.userRepository.findOne({
            where: { email },
            select: [
                "id",
                "firstName",
                "lastName",
                "email",
                "role",
                "password",
            ],
        });

        return user;
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: { id },
            relations: { tenant: true },
        });
    }

    async update(
        userId: number,
        { firstName, lastName, role }: LimitedUserData,
    ) {
        try {
            return await this.userRepository.update(userId, {
                firstName,
                lastName,
                role,
            });
        } catch (err) {
            const error = createHttpError(
                500,
                "Failed to update the user in database!",
            );
            throw error;
        }
    }

    async getAll(validatedQuery: UserQueryParams) {
        // return await this.userRepository.find(); // Problem

        //: Add Pagination
        const queryBuilder = this.userRepository.createQueryBuilder();
        const result = await queryBuilder
            .skip((validatedQuery.currentPage - 1) * validatedQuery.perPage)
            .take(validatedQuery.perPage)
            .getManyAndCount();

        // console.log(result);
        return result;
    }

    async deleteById(userId: number) {
        try {
            return await this.userRepository.delete(userId);
        } catch (err) {
            const error = createHttpError(
                500,
                "Failed to delete the user from database!",
            );
            throw error;
        }
    }
}
