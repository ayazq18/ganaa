import mongoose, { ObjectId } from 'mongoose';
import { IUser } from '../../../models/user.model';
import { IActivityName } from './i.group.activity';

export interface IGroupTab extends mongoose.Document {
  activityDateTime: Date;
  tabInfo: [
    {
      name: IActivityName;
      note?: string;
      createdAt: Date;
    },
  ];
  selectedCenter?: {
    id: ObjectId | string | null;
    name: string;
  };

  createdBy?: ObjectId | IUser;
  createdAt: Date;
}
