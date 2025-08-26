import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { UserService } from 'src/user/user.service';
import { createGroupDto } from './dto/createGroup.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { addOrRemoveMemberDto } from './dto/addOrRemoveMember.dto';
import { GroupWithMembers } from 'src/common/types/group';

@Controller('/group')
@UseGuards(AuthGuard)
export class GroupController {
  constructor(
    private groupService: GroupService,
    private userService: UserService,
  ) {}

  @Post('/create')
  async createNewGroup(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() data: createGroupDto,
  ) {
    try {
      await this.groupService.createGroup({ ...data });
      response.status(200);
      // doing this to address circular json issue
      return { message: 'Group created successfully' };
    } catch (error) {
      response.status(500);
      return { message: 'Could not create group' };
    }
  }

  @Get('/:groupId')
  async getGroupDetails(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('groupId') groupId: mongoose.Types.ObjectId,
  ) {
    const group = await this.groupService.findSingleGroupById(groupId);
    if (!group) {
      response.status(404);
      return { message: 'Group not found' };
    }

    // Fetch locations from redis

    group.memberIds.push(group.ownerId);
    const memberDetails = (
      await Promise.all(
        group.memberIds.map((id) => this.userService.findUserById(id)),
      )
    ).filter((user): user is NonNullable<typeof user> => !!user);

    const ownerDetails = await this.userService.findUserById(group.ownerId);

    response.status(200);

    return {
      ...group,
      ownerDetails,
      memberDetails,
    };
  }

  @Post('/:groupId/add-member')
  async addMemberToGroup(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('groupId') groupId: mongoose.Types.ObjectId,
    @Body() data: addOrRemoveMemberDto,
  ) {
    try {
      const group = await this.groupService.findSingleGroupById(groupId);
      if (!group) {
        response.status(404);
        return { message: 'Group not found' };
      }

      const member = await this.userService.findUserByEmail(data.email);
      if (!member) {
        response.status(404);
        return { message: `Member with email ${data.email} not found` };
      }

      if (group?.memberIds.includes(member._id))
        response.status(200).send({ message: 'Member already in group' });

      await this.groupService.addMemberToGroup(groupId, member._id);

      response.status(200);
      return { message: 'Member added to group' };
    } catch (error) {
      response.status(500);
      return { message: 'Could not add member to group', error: error };
    }
  }

  @Delete('/:groupId/remove-member/:memberId')
  async removeMemberFromGroup(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('groupId') groupId: mongoose.Types.ObjectId,
    @Param('memberId') memberId: mongoose.Types.ObjectId,
  ) {
    try {
      const group = await this.groupService.findSingleGroupById(groupId);
      if (!group) {
        response.status(404);
        return { message: 'Group not found' };
      }

      // const member = await this.userService.findUserByEmail(data.email);
      // if (!member) {
      //   response.status(400);
      //   return { message: `Member with email ${data.email} not found` };
      // }

      if (!group?.memberIds.includes(memberId)) {
        response.status(200);
        return { message: 'Member removed from group' };
      }

      await this.groupService.removeMemberFromGroup(groupId, memberId);

      response.status(200);
      return { message: 'Member removed from group' };
    } catch (error) {
      response.status(500);
      return { message: 'Could not remove from group', error: error };
    }
  }

  @Get('/get-all/:userId')
  async getAllGroupsForUser(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('userId') userId: mongoose.Types.ObjectId,
  ) {
    try {
      const ownedGroups =
        (await this.groupService.findGroupsByOwnerId(userId)) || [];

      const memberGroups =
        (await this.groupService.findGroupsByMemberId(userId)) || [];

      const allGroups = [...ownedGroups, ...memberGroups];

      const completeGroupDetails: GroupWithMembers[] = [];

      for (const group of allGroups) {
        // const others = group.memberIds.filter((id) => id != userId);
        group.memberIds.push(group.ownerId);
        const memberDetails = (
          await Promise.all(
            group.memberIds.map((id) => this.userService.findUserById(id)),
          )
        ).filter((user): user is NonNullable<typeof user> => !!user);

        const ownerDetails = await this.userService.findUserById(group.ownerId);

        if (!ownerDetails) continue;

        completeGroupDetails.push({
          ...group,
          ownerDetails,
          memberDetails,
        });
      }

      // console.log(completeGroupDetails);

      response.status(200);
      return { data: completeGroupDetails };
    } catch (error) {
      response.status(500);
      return { message: 'Could not retrieve groups', error: error };
    }
  }
}
