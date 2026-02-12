import ErrorLog from "@app/_utils/ErrorLog";
import notification from "@app/_model/Notification/notification";

export async function Notification_Create(createFor: string[], title: string,description: string, p0?: string,) {
    if (!createFor || !description || !title) {
        return await ErrorLog(`Notification Creating`, new Error(`createFor -> ${createFor} || description -> ${description} || title -> ${title}`))
    }
    await notification.create(
        {
            createFor: createFor,
            description,
            title,
        }
    )
}