import LogModel from "@app/_model/LogModel/LogModel";
export default async function ErrorLog (name:string,error:any) {
    await LogModel.create({
        errorName:name,
        code:error?.code,
        errorDescription:error?.message,
        other:JSON.stringify(error),
    })
}