var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from 'express';
import userModel from '../user/user.model';
class ReportController {
    constructor() {
        this.path = '/report';
        this.router = Router();
        this.user = userModel;
        this.generateReport = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const usersByCountries = yield this.user.aggregate([
                {
                    $match: {
                        'address.country': {
                            $exists: true,
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            country: '$address.country',
                        },
                        users: {
                            $push: {
                                _id: '$_id',
                                name: '$name',
                            },
                        },
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'posts',
                        localField: 'users._id',
                        foreignField: 'author',
                        as: 'articles',
                    },
                },
                {
                    $addFields: {
                        amountOfArticles: {
                            $size: '$articles',
                        },
                    },
                },
                {
                    $sort: {
                        amountOfArticles: 1,
                    },
                },
            ]);
            response.send({
                usersByCountries,
            });
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}`, this.generateReport);
    }
}
export default ReportController;
//# sourceMappingURL=report.controller.js.map