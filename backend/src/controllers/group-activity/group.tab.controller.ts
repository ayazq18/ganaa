import AppError from '../../utils/appError';
import catchAsync from '../../utils/catchAsync';
import { Response, NextFunction } from 'express';
import GroupTab from '../../models/group-activity/group.tab.model';
import { UserRequest } from '../../interfaces/extra/i_extended_class';
 import Center from '../../models/resources/center.model'

export const getAllGroupTab = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    if (!req.query.date) return next(new AppError('Date is Mandatory', 400));

    const dt = new Date(req.query.date as string);
    dt.setHours(13, 0, 0, 0);

    const data = await GroupTab.find({ activityDateTime: dt });

    res.status(200).json({
      status: 'success',
      data: data,
    });
  }
);

// export const createNewGroupTab = catchAsync(
//   async (req: UserRequest, res: Response, next: NextFunction) => {
//     if (!req.body.activityDateTime)
//       return next(new AppError('Activity Date Time is Mandatory', 400));
//     if (!req.body.tabInfo) return next(new AppError('Tab Info is Mandatory', 400));

//     req.body.createdBy = req.user?._id;

//     const dt = new Date(req.body.activityDateTime);
//     dt.setHours(13, 0, 0, 0);
//     req.body.activityDateTime = dt;

//     const existing = await GroupTab.findOne({ activityDateTime: dt });
//     if (existing) return next(new AppError(`An tab info for this date already exists`, 400));

//     const data = await GroupTab.create(req.body);

//     res.status(201).json({
//       status: 'success',
//       data: data,
//     });
//   }
// );
export const createNewGroupTab = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    if (!req.body.activityDateTime)
      return next(new AppError("Activity Date Time is Mandatory", 400));
    if (!req.body.tabInfo)
      return next(new AppError("Tab Info is Mandatory", 400));

    req.body.createdBy = req.user?._id;

    // normalize date (set specific time)
    const dt = new Date(req.body.activityDateTime);
    dt.setHours(13, 0, 0, 0);
    req.body.activityDateTime = dt;

    // ✅ validate selected center
    let selectedCenterObj = null;
    if (req.body.selected && req.body.selected !== "all") {
      const validCenter = await Center.findOne({
        _id: req.body.selected,
        isDeleted: false,
      }).select("_id centerName");

      if (!validCenter) {
        return next(new AppError("Invalid Center ID provided", 400));
      }

      selectedCenterObj = {
        id: validCenter._id,
        name: validCenter.centerName,
      };
      console.log("Selected Center Object:", selectedCenterObj.name);
    } else if (req.body.selected === "all") {
      selectedCenterObj = {
        id: null,
        name: "All",
      };
    }

    // ✅ uniqueness check per center
    const existing = await GroupTab.findOne({
      activityDateTime: dt,
      "selectedCenter.id": selectedCenterObj?.id || null,
    });

    if (existing) {
      return next(
        new AppError(
          `A tab info for this date already exists for this center`,
          400
        )
      );
    }

    // create new tab
    const data = await GroupTab.create({
      tabInfo: req.body.tabInfo,
      activityDateTime: dt,
      selectedCenter: selectedCenterObj,
      createdBy: req.body.createdBy,
    });

    console.log("Created Group Tab Data:", data);

    res.status(201).json({
      status: "success",
      data,
    });
  }
);

export const getSingleGroupTab = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    if (req.params.id === null) return next(new AppError('ID in Params is Mandatory', 400));

    const data = await GroupTab.findById(req.params.id).lean();

    if (!data) return next(new AppError('No Data Found', 400));

    res.status(200).json({
      status: 'success',
      data: data,
    });
  }
);

export const updateSingleGroupTab = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    if (!req.params.id) return next(new AppError('ID in Params is Mandatory', 400));

    console.log("hii harshit ");
    console.log("hii req body is :", req.body);

    // fetch all centers
    const centers = await Center.find({ isDeleted: false }).select("_id name");
    console.log("All Centers from DB:", centers);

    // check if selected id is valid
    let selectedCenterObj = null;
    if (req.body.selected && req.body.selected !== "all") {
      const validCenter = await Center.findOne({
        _id: req.body.selected,
        isDeleted: false,
      }).select("_id centerName");

      if (!validCenter) {
        return next(new AppError("Invalid Center ID provided", 400));
      }

      selectedCenterObj = {
        id: validCenter._id,
        name: validCenter.centerName,
      };
      console.log("Selected Center Object:", selectedCenterObj.name
      );
    } else if (req.body.selected === "all") {
      selectedCenterObj = {
        id: null,
        name: "All",
      };
    }

    // update tab with center info
    const data = await GroupTab.findByIdAndUpdate(
      req.params.id,
      {
        tabInfo: req.body.tabInfo,
       
        selectedCenter: selectedCenterObj,
      },
      { new: true }
    );

    if (!data) return next(new AppError('Please Provide Valid Group Tab ID', 400));
    console.log("Updated Group Tab Data:", data);

    res.status(200).json({
      status: 'success',
      data,
    });
  }
);


export const deleteSingleGroupTab = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    if (req.params.id === null) return next(new AppError('ID in Params is Mandatory', 400));

    await GroupTab.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Data deleted successfully',
    });
  }
);
