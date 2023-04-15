import { Request, Response } from "express";
import ShortLinkModels from "../models/short_link";
import { ApiResponse, defaultResponse } from "../helpers/type/api_response_struct";
import { DataUrl } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
const ShortLinkController = {
    getAll: async (req: Request, res: Response<ApiResponse>) => {

        if (req.query['page'] === undefined) {
            return res.status(200).json({ ...defaultResponse, status: "ERROR", code: "REQUIRED_PAGE" })
        }
        if (req.query['limit'] === undefined) {
            return res.status(200).json({ ...defaultResponse, status: "ERROR", code: "REQUIRED_LIMIT" })

        }
        const limit = parseInt(req.query['limit']?.toString() ?? '5')
        const page = parseInt(req.query['page']?.toString() ?? '1')
        const userId = req.headers['x-control-user']

        if (Number.isNaN(page)) {
            return res.status(200).json({ ...defaultResponse, status: "ERROR", code: "REQUIRED_PAGE" })
        }

        if (Number.isNaN(limit)) {
            return res.status(200).json({ ...defaultResponse, status: "ERROR", code: "REQUIRED_LIMIT" })
        }

        let totalData = 0;
        ShortLinkModels.count().then(v => {
            totalData = v
        }).catch(e => {
            return res.status(500).json({ ...defaultResponse, status: 'ERROR', code: "SERVER_ERROR" })
        })


        ShortLinkModels.getAll(page - 1, limit, userId?.toString()!).then(v => {
            return res.status(200).json({ ...defaultResponse, data: { page: page, last_page: Math.ceil(totalData / limit), total: totalData, datas: v } })
        }).catch(e => {
            console.log(e);
            return res.status(500).json({ ...defaultResponse, status: 'ERROR', code: "SERVER_ERROR" })

        })
    },
    store: async (req: Request, res: Response<ApiResponse>) => {
        const title = req.body['title']
        const destination = req.body['destination']
        const backHalf = req.body['backHalf']
        const userId = req.headers['x-control-user']
        const id = uuidv4()

        if (title === undefined) {
            return res.status(200).json({ ...defaultResponse, status: "ERROR", code: "REQUIRED_TITLE" })
        }
        if (destination === undefined) {
            return res.status(200).json({ ...defaultResponse, status: "ERROR", code: "REQUIRED_DESTINATION" })
        }
        if (backHalf === undefined) {
            return res.status(200).json({ ...defaultResponse, status: "ERROR", code: "REQUIRED_BACKHALF" })
        }
        const data: DataUrl = {
            id: id,
            user_id: userId?.toString()!,
            back_half: backHalf,
            destination: destination,
            count_clicks: 0,
            title: title,
            is_deleted: 0,
            createdAt: dayjs(Date.now()).toDate(),
            updatedAt: dayjs(Date.now()).toDate()
        }
        ShortLinkModels.store(data).then((v) => {
            return res.status(200).json({ ...defaultResponse })
        }).catch((e) => {
            return res.status(500).json({ ...defaultResponse, status: 'ERROR', code: "SERVER_ERROR" })

        })
    },

}

export default ShortLinkController