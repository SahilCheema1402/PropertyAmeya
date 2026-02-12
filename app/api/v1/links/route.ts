import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import linksModel from './../../../_model/Links/links.model';
import { DateTime } from 'luxon';


export async function GET(req: Request) {
  try {
    await DB();
    const user: any = JSON.parse(req.headers.get('user') as string);

    const filterCriteria = {
      createdBy: user._id,
      company: user.company._id,
    };
;

    const result = await linksModel.find(filterCriteria);
    // Handle response
    return HandleResponse({
      type: 'SUCCESS',
      message: 'Fetched Group Details successfully.',
      data: result,
    });

  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    });
  }
}

// Create a new group
export async function POST(req: Request) {
  try {
    await DB();

    const form = await req.formData();

    const user: any = JSON.parse(req.headers.get('user') as string);
    if (!user || !user._id || !user.company?._id) {
      return HandleResponse({ type: "BAD_REQUEST", message: "User information is missing" });
    }
    const name = form.get('name');
    const logo = form.get('logo');
    const websiteUrl = form.get('websiteUrl');
    const group_ = new linksModel({
      logo,
      websiteUrl,
      name,
      createdBy: user?._id,
      company: user?.company?._id,
      createAt:DateTime.now().setZone('Asia/Kolkata')
    })
    const data = await group_.save();
    return HandleResponse({ type: "SUCCESS", message: "Link Created Successfully", data: { name: data.name, websiteUrl: data.websiteUrl } })
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    })
  }
}

export async function PATCH(req: Request) {
  try {
    await DB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();
    if (!id) {
      return HandleResponse({ type: "BAD_REQUEST", message: "ID is required" });
    }
    await linksModel.findByIdAndUpdate(id, {
      name: body?.userId?.name,
      websiteUrl: body?.userId?.description
    });
    return HandleResponse({
      type: "SUCCESS",
      message: "Group Update successfully",
    });

  } catch (error: any) {
    // Handle any errors
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error.message
    });
  }
}
// Update a quotation by ID
export async function PUT(req: Request) {
  try {
    await DB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();
    if (!id) {
      return HandleResponse({ type: "BAD_REQUEST", message: "ID is required" });
    }

    await linksModel.findByIdAndUpdate({ _id: id }, {
      $push: { groupUserId: body.userId }
    })
    return HandleResponse({
      type: "SUCCESS",
      message: "User added to group successfully",
    });
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message || 'Something went wrong',
    });
  }
}

// Delete a group by ID
export async function DELETE(req: Request) {
  try {
    await DB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return HandleResponse({ type: "BAD_REQUEST", message: "Group ID is missing" });
    }

    await linksModel.findByIdAndDelete(id);

    return HandleResponse({
      type: "SUCCESS",
      message: "Deleted successfully",
    });
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    });
  }
}

