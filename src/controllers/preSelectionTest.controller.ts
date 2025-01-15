import { Request, Response } from "express";
import { PreSelectionTestService } from "../services/preSelectionTest.service";

export class PreSelectionTestController {
  private preSelectionTestService: PreSelectionTestService;

  constructor() {
    this.preSelectionTestService = new PreSelectionTestService();
  }

  public async createPreSelectionTest(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { testName, image, passingGrade, duration } = req.body;
      const authorizationHeader = req.headers.authorization ?? "";
      if (!authorizationHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error:
            'Authorization token is required and must be in the format "Bearer <token>"',
        });
        return;
      }
      const token = authorizationHeader.split(" ")[1];
      const result = await this.preSelectionTestService.createPreSelectionTest({
        testName,
        image,
        passingGrade,
        duration,
        token,
      });
      if (typeof result === "string") {
        res.status(400).json({ error: result });
        return;
      }
      res.status(201).json({
        message: "Pre-selection test created successfully!",
        data: result,
      });
      return;
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  async deletePreSelectionTest(req: Request, res: Response): Promise<void> {
    const { testId } = req.params;

    if (!testId) {
        res.status(400).json({ message: "Test ID is required" });
        return; 
    }

    try {
        const result = await this.preSelectionTestService.deletePreSelectionTest(Number(testId));

        if (typeof result === "string") {
            res.status(400).json({ message: result });
            return; 
        }
        res.status(200).json({
            message: "Pre-selection test deleted successfully",
            updatedPreSelectionTest: result,
        });
    } catch (error) {
        const err = error as Error;

        res.status(500).json({ message: `Error: ${err.message}` });
        return; 
    }
}

  async updatePreSelectionTest(req: Request, res: Response): Promise<void> {
    try {
      const { testName, image, passingGrade, duration } = req.body;
      const { testId } = req.params;
      const testIdNumber = parseInt(testId, 10);
      if (isNaN(testIdNumber)) {
        res.status(400).json({ error: "Invalid testId format" });
        return;
      }
      const authorizationHeader = req.headers.authorization ?? "";
      if (!authorizationHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error:
            'Authorization token is required and must be in the format "Bearer <token>"',
        });
      }

      const token = authorizationHeader.split(" ")[1];
      const result = await this.preSelectionTestService.updatePreSelectionTest({
        testId: testIdNumber,
        testName,
        image,
        passingGrade,
        duration,
        token,
      });
      if (typeof result === "string") {
        res.status(400).json({ error: result });
        return;
      }
      res.status(201).json({
        message: "Pre-selection test updated successfully",
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: `Error : ${err.message} ` });
    }
  }

  async createTest(req: Request, res: Response): Promise<void> {
    try {
      const { testId } = req.params;
      const { questions } = req.body;
      if (!questions || !Array.isArray(questions)) {
        res
          .status(400)
          .json({ error: "Questions must be an array of 25 items." });
        return;
      }
      if (questions.length !== 25) {
        res
          .status(400)
          .json({ error: "You must provide exactly 25 questions." });
        return;
      }
      const createdQuestions = await this.preSelectionTestService.createTest(
        Number(testId),
        questions,
      );
      if (typeof createdQuestions === "string") {
        res.status(400).json({ error: createdQuestions });
        return;
      }
      res.status(201).json({
        message: "Test questions created successfully",
        data: createdQuestions,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: `Error: ${err.message}` });
    }
  }

  async updateTest(req: Request, res: Response): Promise<void> {
    try {
      const { testId } = req.params;
      const { questions } = req.body;
      if (!questions || !Array.isArray(questions)) {
        res.status(400).json({ error: "Questions must be an array." });
        return;
      }
      if (questions.length !== 25) {
        res
          .status(400)
          .json({ error: "You must provide exactly 25 questions." });
        return;
      }
      for (const question of questions) {
        if (!question.questionId) {
          res
            .status(400)
            .json({ error: "Each question must have a valid 'questionId'." });
          return;
        }
      }
      const authorizationHeader = req.headers.authorization ?? "";
      if (!authorizationHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error:
            'Authorization token is required and must be in the format "Bearer <token>"',
        });
        return;
      }
      const token = authorizationHeader.split(" ")[1];
      const result = await this.preSelectionTestService.updateTestQuestions({
        preSelectionTestId: Number(testId),
        questions,
        token,
      });
      if (result.status === "error") {
        res.status(400).json({ error: result.message });
        return;
      }
      res.status(200).json({
        message: result.message,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: `Error: ${err.message}` });
    }
  }

  public async getPreSelectionTestsByCompanyController(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const authorizationHeader = req.headers.authorization ?? "";
      if (!authorizationHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error:
            'Authorization token is required and must be in the format "Bearer <token>"',
        });
        return;
      }

      const token = authorizationHeader.split(" ")[1];
      const result =
        await this.preSelectionTestService.getPreSelectionTestsByCompany(token);
      if (typeof result === "string" || result?.error) {
        res.status(400).json({ error: result.error || result });
        return;
      }
      res.status(200).json({
        message: "Pre-selection tests fetched successfully",
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: `Error: ${err.message}` });
    }
  }

  public async getPreSelectionTestById(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { testId } = req.params;

      if (!testId) {
        res.status(400).json({ error: "Test ID is required" });
        return;
      }
      const authorizationHeader = req.headers.authorization ?? "";
      if (!authorizationHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error:
            'Authorization token is required and must be in the format "Bearer <token>"',
        });
        return;
      }

      const token = authorizationHeader.split(" ")[1];
      const result = await this.preSelectionTestService.getPreSelectionTestById(
        token,
        Number(testId),
      );
      if (typeof result === "string" || result?.error) {
        res.status(400).json({ error: result.error || result });
        return;
      }
      res.status(200).json({
        message: "Pre-selection test fetched successfully ok",
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: `Error: ${err.message}` });
    }
  }

  public async getTestByPreTestId(req: Request, res: Response): Promise<void> {
    try {
      const { testId } = req.params;

      if (!testId) {
        res.status(400).json({ error: "Test ID is required." });
        return;
      }
      const authorizationHeader = req.headers.authorization ?? "";

      if (!authorizationHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error:
            'Authorization token is required and must be in the format "Bearer <token>"',
        });
        return;
      }
      const token = authorizationHeader.split(" ")[1];
      const result = await this.preSelectionTestService.getTestByPreTestId(
        Number(testId),
        token,
      );
      if (typeof result === "string" || result?.error) {
        res.status(400).json({ error: result.error || result });
        return;
      }
      res.status(200).json({
        message: "Pre-selection test fetched successfully",
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: `Error: ${err.message}` });
    }
  }

  public async softDeletePreSelectionTest(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { testId } = req.params;

    if (!testId) {
      res.status(400).json({ message: "Test ID is required" });
      return;
    }

    try {
      const result =
        await this.preSelectionTestService.softDeletePreSelectionTest(
          Number(testId),
        );

			if (typeof result === "string") {
				res.status(400).json({ message: result });
				return;
			}
			res.status(200).json({
				message: "Pre-selection test deleted successfully",
				updatedPreSelectionTest: result,
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ message: `Error: ${err.message}` });
		}
	}

  public async getPreSelectionTestByIdHead(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { testId } = req.params;

      if (!testId) {
        res.status(400).json({ error: "Test ID is required" });
        return;
      }
      const authorizationHeader = req.headers.authorization ?? "";
      if (!authorizationHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error:
            'Authorization token is required and must be in the format "Bearer <token>"',
        });
        return;
      }
      const token = authorizationHeader.split(" ")[1];
      const result =
        await this.preSelectionTestService.getPreSelectionTestByIdHead(
          token,
          Number(testId),
        );
      if (typeof result === "string" || result?.error) {
        res.status(400).json({ error: result.error || result });
        return;
      }
      res.status(200).json({
        message: "Pre-selection test fetched successfully",
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: `Error: ${err.message}` });
    }
  }

  public async getPreSelectionTestsByCompanyControllerForSelection(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const authorizationHeader = req.headers.authorization ?? "";
      if (!authorizationHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error:
            'Authorization token is required and must be in the format "Bearer <token>"',
        });
        return;
      }

      const token = authorizationHeader.split(" ")[1];
      const result =
        await this.preSelectionTestService.getPreSelectionTestsByCompanyForSelection(
          token,
        );
      if (typeof result === "string" || result?.error) {
        res.status(400).json({ error: result.error || result });
        return;
      }
      res.status(200).json({
        message: "Pre-selection tests fetched successfully",
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: `Error: ${err.message}` });
    }
  }
}
