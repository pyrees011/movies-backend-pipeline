import mongoose from 'mongoose';
import Message from '../../models/messages.model';
import { Request, Response } from 'express';
import { IMessage } from '../../interfaces/message.interface';
import { getMockReq, getMockRes } from '@jest-mock/express';
import * as messageController from '../../controllers/messages.controller';
import logger from '../../middleware/winston';

jest.mock('../../middleware/winston', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
  };
});

interface CustomSession {
  user: {
    _id: mongoose.Types.ObjectId;
    email?: string;
  };
}

type CustomRequest = Request & { session: CustomSession };

describe('testing message controller', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  describe('add message function', () => {
    const sampleMessageValue: {
      name: IMessage['name'];
      user: IMessage['user'];
    } = {
      name: 'mock name',
      user: new mongoose.Types.ObjectId(),
    };
    let req: CustomRequest;
    let res: Response;
    let saveStub: jest.SpyInstance;

    beforeEach(() => {
      req = getMockReq<CustomRequest>({
        body: {
          message: {
            name: sampleMessageValue.name,
            user: sampleMessageValue.user,
          },
        },
        session: {
          user: {
            _id: sampleMessageValue.user,
          },
        },
      });
      res = getMockRes().res;
      saveStub = jest.spyOn(Message.prototype, 'save');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 400 if message or message.name is missing', async () => {
      req.body = {};
      await messageController.addMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should return 500 if user is not authenticated', async () => {
      req.session.user = null;
      await messageController.addMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You are not authenticated',
      });
    });

    it('should return 201 and save the message successfully', async () => {
      const mockMessage = new Message({
        ...sampleMessageValue,
        user: req.session.user._id,
      });

      saveStub.mockResolvedValue(mockMessage);

      await messageController.addMessage(req, res);

      expect(saveStub).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      // expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it('should return 500 if there is an error while saving the message', async () => {
      saveStub.mockRejectedValue(new Error('Save failed'));

      await messageController.addMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to add message' });
    });
  });

  describe('PUT edit message function', () => { 
    const sampleMessageValue: {
      name: IMessage['name'];
      user: IMessage['user'];
    } = {
      name: 'mock name',
      user: new mongoose.Types.ObjectId(),
    };
    let req: CustomRequest;
    let res: Response;
    let findByIdAndUpdateStub: jest.SpyInstance;

    beforeEach(() => {
      req = getMockReq<CustomRequest>({
        body: {
          name: sampleMessageValue.name,
        },
        params: {
          messageId: new mongoose.Types.ObjectId().toHexString(),
        },
      });
      res = getMockRes().res;
      findByIdAndUpdateStub = jest.spyOn(Message, 'findByIdAndUpdate');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 400 if name or messageId is missing', async () => {
      req.body = {};
      await messageController.editMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should return 404 if message is not found', async () => {
      findByIdAndUpdateStub.mockResolvedValue(null);

      await messageController.editMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Message not found' });
    });

    it('should return 200 and update the message successfully', async () => {
      const mockMessage = new Message({
        ...sampleMessageValue,
        _id: req.params.messageId,
      });

      findByIdAndUpdateStub.mockResolvedValue(mockMessage);

      await messageController.editMessage(req, res);

      expect(findByIdAndUpdateStub).toHaveBeenCalledWith(
        req.params.messageId,
        { name: req.body.name },
        { new: true },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it('should return 500 if there is an error while updating the message', async () => {
      findByIdAndUpdateStub.mockRejectedValue(new Error('Update failed'));

      await messageController.editMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to edit message' });
    });
   })
});
