import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import User from './../../../_model/user/user.model';
import bcrypt from 'bcrypt';

export async function GET(req: Request) {
    try {
        await DB();
        const { searchParams } = new URL(req.url);
        const _id = searchParams.get('id');
      if (_id !== "undefined" && _id) {
        // const cleanedUserId = _id.replace(/"/g, '');
            const staffArray = await User.findById(_id);
            return HandleResponse({
                type: "SUCCESS",
                message: "Staff Details retrieved successfully.",
                data: [staffArray],
            });
      }else{
        const staffArray = await User.find();
         return HandleResponse({
          type: "SUCCESS",
          message: "Staff Details retrieved successfully.",
          data: staffArray,
        });
      }
    } catch (error) {
      console.error("An error occurred while retrieving users",error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: "An error occurred while retrieving users. Please try again."
        });
    }
    }

export async function PATCH(req: Request) {
  try {
    await DB();
    const user = JSON.parse(req.headers.get('user') as string);
    const { currentPassword, newPassword, confirmPassword } = await req.json();
    console.log("currentPassword",currentPassword,"newPassword",newPassword,confirmPassword)
    if (!currentPassword || !newPassword || !confirmPassword) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "All fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "New password and confirm password do not match.",
      });
    }

    const userData = await User.findOne({ email: user.email }).select('+password');
    if (!userData) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "User not found with this email.",
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isPasswordValid) {
      return HandleResponse({
        type: "UNAUTHORIZED",
        message: "Current password is incorrect.",
      });
    }
    userData.password = newPassword;
    await userData.save();

    return HandleResponse({
      type: "SUCCESS",
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: "An error occurred. Please try again later.",
    });
  }
}
