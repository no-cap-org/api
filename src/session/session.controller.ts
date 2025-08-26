import { Controller, Get, Req, Res, } from '@nestjs/common';
import { SessionService } from './session.service';
import { Request, Response } from 'express';
import { UserService } from 'src/user/user.service';
import mongoose from 'mongoose';


@Controller('/session')
export class SessionController {
  constructor(
    private sessionService: SessionService,
    private userService: UserService,
  ) {}

  @Get('/user-info')
  async getUserSessionInfo(@Req() request: Request, @Res() response: Response) {
    const sessionId: mongoose.Types.ObjectId = request.cookies['sessionId'];

    if (!sessionId) {
      return response.status(404).send({
        message: 'Session id not found',
      });
    }

    const sessionInfo =
      await this.sessionService.findActiveSessionBySessionId(sessionId);

    if (!sessionInfo) {
      return response.status(404).send({
        message: 'session info not found',
      });
    }

    const userInfo = await this.userService.findUserById(sessionInfo.userId);

    if (userInfo) {
      return response.status(200).send({
        user: userInfo,
        email: userInfo?.email,
        sessionId: sessionId,
      });
    }

    return response.status(404).send({
      message: 'session info not found',
    });
  }
}
