import { NextFunction, Request, Response } from "express";
import { TenantService } from "../services/TenantService";
import { CreateTenantRequest } from "../types";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}

    async create(req: CreateTenantRequest, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { name, address } = req.body;

        this.logger.debug("Request for creating a tenant.", req.body);

        try {
            const tenant = await this.tenantService.create({ name, address });
            this.logger.info("Tenant has been created.", { id: tenant.id });

            res.status(201).json({ id: tenant.id });
        } catch (err) {
            return next(err);
        }
    }

    async update(req: CreateTenantRequest, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            res.status(400).json({ errors: result.array() });
        }

        const { name, address } = req.body;
        const tenantId = req.params.id;

        if (isNaN(Number(tenantId))) {
            next(createHttpError(400, "Invalid url params!"));
            return;
        }

        this.logger.debug("Request for updating a tenant.", req.body);

        try {
            await this.tenantService.update(Number(tenantId), {
                name,
                address,
            });

            this.logger.info("Tenant has been updated.", { id: tenantId });

            return res.status(200).json({ id: Number(tenantId) });
        } catch (err) {
            return next(err);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const tenants = await this.tenantService.getAll();

            this.logger.info("All tenant have been fetched!");

            res.status(200).json(tenants);
        } catch (err) {
            return next(err);
        }
    }
}
