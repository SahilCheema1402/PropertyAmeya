import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import Quotation from './../../../_model/Quotation/quotation.model';
// Get all quotations or a specific one by ID
export async function GET(req: Request) {
  try {
    DB();
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('searchTerm')?.trim();
    let quotations;
    if (searchTerm) {
      const searchTermAsNumber = parseFloat(searchTerm);  // Convert the search term to a number

      const quotations = await Quotation.aggregate([
        {
          $match: {
            $or: [
              // Match strings with regex
              { "name": { $regex: searchTerm, $options: 'i' } },
              { "companyName": { $regex: searchTerm, $options: 'i' } },
              { "notes": { $regex: searchTerm, $options: 'i' } },
              { "services": { $elemMatch: { name: { $regex: searchTerm, $options: 'i' } } } },
              { "formType": { $regex: searchTerm, $options: 'i' } },
              // For price and tax, match either as strings (regex) or as numbers
              ...(isNaN(searchTermAsNumber) ? [
                // If searchTerm is not a number, treat it as a string
                { "services": { $elemMatch: { price: { $regex: searchTerm, $options: 'i' } } } },
                { "tax": { $regex: searchTerm, $options: 'i' } }
              ] : [
                // If searchTerm is a number, treat it as a numeric comparison
                { "services": { $elemMatch: { price: searchTermAsNumber } } },
                { "tax": searchTermAsNumber }
              ])
            ]
          }
        }
      ]);
      return HandleResponse({
        type: "SUCCESS",
        message: "Updated successfully.",
        data: quotations
      });

    } else {
      quotations = await Quotation.find().lean();
      return HandleResponse({
        type: "SUCCESS",
        message: "Updated successfully.",
        data: quotations
      });
    }
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    });
  }
}


// Create a new quotation
export async function POST(req: Request) {
  try {
    DB();

    const fields = await req.json();
    if (!fields) {
      return HandleResponse({ type: "BAD_REQUEST", message: "Fields are missing" });
    }
    if (fields?.services && Array.isArray(fields?.services)) {
      fields.services = fields?.services?.map((service: { price: any; tax: any; }) => ({
        ...service,
        price: Number(service.price),
        tax: Number(fields.tax || 0),
      }));
    }
    // Create a new Quotation
    const newQuotation = new Quotation({
      ...fields,

    });

    const savedQuotation = await newQuotation.save();
    return HandleResponse({
      type: "SUCCESS",
      message: "Quotation created successfully",
      data: savedQuotation,
    });
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message,
    });
  }
}

export async function PATCH(req: Request) {
  try {
    await DB();
    const { searchTerm } = await req.json();
    const results = await Quotation.find({
      $or: [
        { "name": { $regex: new RegExp(searchTerm, 'i') } },
        { "companyName": { $regex: new RegExp(searchTerm, 'i') } },
        { "notes": { $regex: new RegExp(searchTerm, 'i') } },
        { "services.name": { $regex: new RegExp(searchTerm, 'i') } },
        { "formType": { $regex: new RegExp(searchTerm, 'i') } },
        { "tax": { $regex: new RegExp(searchTerm, 'i') } },
        { "notes": { $regex: new RegExp(searchTerm, 'i') } },
        { "services.price": { $regex: new RegExp(searchTerm, 'i') } }

      ]
    });
    return HandleResponse({
      type: "SUCCESS",
      message: "Quotation Data  Fetch successfully",
      data: results
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
    DB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) {
      return HandleResponse({ type: "BAD_REQUEST", message: "Quotation ID is missing" })
    }

    const updatedQuotation = await Quotation.findByIdAndUpdate(id, body, { new: true });

    if (!updatedQuotation) {
      return HandleResponse({ type: "BAD_REQUEST", message: "Quotation not found" })
    }

    return HandleResponse({
      type: "SUCCESS",
      message: "Quotation updated successfully",
      data: updatedQuotation
    });
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.messageS
    });
  }
}

// Delete a quotation by ID
export async function DELETE(req: Request) {
  try {
    DB();
    const fields = await req.json();
    if (fields.length === 0) {
      return HandleResponse({ type: "BAD_REQUEST", message: "Quotation ID is missing" })

    }
    fields.map(async (item: any) => {
      const deletedQuotation = await Quotation.findByIdAndDelete(item);
      if (!deletedQuotation) {
        return HandleResponse({ type: "BAD_REQUEST", message: "Quotation not found" })
      }
    
    })
    return HandleResponse({
      type: "SUCCESS",
      message: "Quotation deleted successfully",
    });


  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    });
  }
}
