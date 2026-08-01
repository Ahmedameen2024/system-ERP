"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = exports.paginatedResponse = exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, data, message = 'تمت العملية بنجاح', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, message, statusCode = 400, errors) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString(),
    });
};
exports.errorResponse = errorResponse;
const paginatedResponse = (res, data, total, page, limit, message = 'تم استرجاع البيانات بنجاح') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
    });
};
exports.paginatedResponse = paginatedResponse;
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20')));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};
exports.getPaginationParams = getPaginationParams;
//# sourceMappingURL=response.js.map