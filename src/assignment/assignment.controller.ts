import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Delete,
  Patch,
  Req,
  Res,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { createAssignmentDto } from './dto/createAssignment.dto';
import { addTaskDto } from './dto/addTask.dto';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from 'src/guards/auth.guard';
import {
  Assignment,
  AssignmentDocument,
} from 'src/database/models/assignment.schema';
import { User } from 'src/database/models/user.schema';
import { AssignmentDetails } from 'src/common/types/assignment';

@Controller('/assignment')
@UseGuards(AuthGuard)
export class AssignmentController {
  constructor(
    private readonly assignmentService: AssignmentService,
    private readonly userService: UserService,
  ) {}

  // Create new assignment
  @Post('/create')
  async createAssignment(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: createAssignmentDto,
  ) {
    try {
      if (body.dueDate < new Date()) {
        response.status(400);
        return { message: "Due date should after today's date" };
      }
      await this.assignmentService.createAssignment(body);
      response.status(200);
      return { message: 'Task created successfully' };
    } catch (error) {
      console.error(error);
      response.status(500);
      return { message: 'Failed to create task' };
    }
  }

  // Get one assignment by ID
  @Get('/:assignmentId')
  async getAssignment(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('assignmentId') assignmentId: mongoose.Types.ObjectId,
  ) {
    try {
      const assignment: AssignmentDetails =
        await this.assignmentService.findAssignmentDetailsById(assignmentId);

      if (!assignment) {
        response.status(404);
        return { message: 'Assignment not found' };
      }

      response.status(200);
      return {
        data: assignment,
      };
    } catch (error) {
      console.error(error);
      response.status(500);
      return { message: 'Failed to retrieve assignment' };
    }
  }

  @Get('/get-all/:userId')
  async getAllAssignments(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('userId') userId: mongoose.Types.ObjectId,
  ) {
    try {
      const ownedAssignments =
        await this.assignmentService.findAssignmentsByOwnerId(userId);

      const assignedAssignments =
        await this.assignmentService.findAssignmentByAssigneeId(userId);

      const assignments = [...ownedAssignments, ...assignedAssignments];

      // console.log(assignments);

      const assignmentDetails = await Promise.all(
        assignments.map((_: AssignmentDocument) =>
          this.assignmentService.findAssignmentDetailsById(_._id),
      ));

      response.status(200);
      return { data: assignmentDetails };
    } catch (error) {
      console.error(error);
      response.status(500);
      return { data: [] };
    }
  }

  // Delete assignment by ID
  @Delete('/:assignmentId')
  async deleteAssignment(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('assignmentId') assignmentId: mongoose.Types.ObjectId,
  ) {
    try {
      await this.assignmentService.deleteAssignmentById(assignmentId);
      response.status(200);
      return { message: 'Assignment removed successfully' };
    } catch (error) {
      console.error(error);
      response.status(500);
      return { message: 'Failed to remove assignment' };
    }
  }

  // Add a new task to assignment
  @Put('/:assignmentId/add-task')
  async addTask(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('assignmentId') assignmentId: mongoose.Types.ObjectId,
    @Body() body: addTaskDto,
  ) {
    try {
      await this.assignmentService.addTaskToAssignment(assignmentId, body);
      response.status(200);
      return { message: 'Task added successfully' };
    } catch (error) {
      response.status(500);
      console.error(error);
      return { message: 'Failed to add task' };
    }
  }

  @Put('/:assignmentId/assign-to')
  async assignTaskTo(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('assignmentId') assignmentId: mongoose.Types.ObjectId,
    @Body() body: { email: string },
  ) {
    try {
      const user = await this.userService.findUserByEmail(body.email);

      if (!user) {
        response.status(400);
        return { message: 'User with email does not exist' };
      }

      await this.assignmentService.assignTaskTo(assignmentId, user._id);

      response.status(200);
      return { message: 'Task assigned to user successfully' };
    } catch (error) {
      response.status(500);
      console.error(error);
      return { message: 'Failed to assign task' };
    }
  }

  // Complete a task by taskId
  @Put('/:assignmentId/task/:taskId/complete')
  async completeTask(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('assignmentId') assignmentId: mongoose.Types.ObjectId,
    @Param('taskId') taskId: mongoose.Types.ObjectId,
  ) {
    try {
      await this.assignmentService.endTaskInAssignment(assignmentId, taskId);
      response.status(200);
      return { message: 'Task marked as complete successfully' };
    } catch (error) {
      console.error(error);
      response.status(500);
      return { message: 'Failed to add task' };
    }
  }

  // Rearrange tasks order
  @Patch('/:id/tasks/reorder')
  async reorderTasks(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('id') assignmentId: mongoose.Types.ObjectId,
    @Body('orderedTaskIds') orderedTaskIds: mongoose.Types.ObjectId[],
  ) {
    return this.assignmentService.rearrangeTasks(assignmentId, orderedTaskIds);
  }
}
