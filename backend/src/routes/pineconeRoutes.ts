import { Router, type Request, type Response } from "express";

const pineConeRouter = Router();

pineConeRouter.post("/pdf", (req: Request, res: Response) => {
    /*
    1. get pdf
    2. load that pdf to document 
    3. save that pdf to pinecone
    */
});

export default pineConeRouter;
