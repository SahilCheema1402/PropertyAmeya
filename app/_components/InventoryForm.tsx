import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { loader } from './../_api_query/store';
import { useDispatch_ } from './../../store';
import { useC_InventoryMutation } from './../_api_query/Inventory/inventory.api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaPlus } from 'react-icons/fa'

interface InventoryFormProps {
  inventoryFormData?: any;
  type_?: string;
  setInventoryFormData?: (data: any) => void;
  setPop: (show: boolean) => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  inventoryFormData,
  type_,
  setPop,
}) => {
  const searchParams = useSearchParams();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm();

  const [inventory, setInventory] = useState<string>('');
  const [inventoryType, setInventoryType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [projectOptions, setProjectOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [statusOptions, setStatusOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [bhkOptions, setBhkOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [typeOptions, setTypeOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [newProject, setNewProject] = useState<string>('');
  const [addProject, setAddProject] = useState<boolean>(false);
  const [tenant, setTenant] = useState<string>('');
  const [landing, setLanding] = useState<string>('');
  const [registry, setRegistry] = useState<string>('');
  const [parking, setParking] = useState<string>('');
  const [parkingType, setParkingType] = useState<string>('');
  const [expVisitTime, setExpVisitTime] = useState<string>('');
  const [availableDate, setAvailableDate] = useState<Date | null>(null);

  useEffect(() => {
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    if (name || phone || email) {
      setValue('name', name || '');
      setValue('mobile', phone || '');
      setValue('email', email || '');
    }
  }, [searchParams, setValue, inventoryFormData]);

  useEffect(() => {
    if (inventoryFormData && type_ === 'update') {
      const fields = [
        'name',
        'mobile',
        'project',
        'bhk',
        'type',
        'email',
        'expected_rent',
        'demand',
        'available_date',
        'deal_closing_date',
        'closing_amount',
        'expVisitTime',
        'facing',
        'area',
        'dimension',
        'purpose',
        'location',
        'unit_no',
        'tower_no',
        'landing_amount',
        'parking',
        'parking_type',
        'front',
        'height'
      ];

      fields.forEach((field) => {
        setValue(field, inventoryFormData[field] || '');
      });

      setLanding(inventoryFormData.landing || '');
      setRegistry(inventoryFormData.registry || '');
      setStatus(inventoryFormData.status || '');
      setInventory(inventoryFormData.inventory || '');
      setInventoryType(inventoryFormData.inventoryType || '');
      setTenant(inventoryFormData.tenant || '');
      setParking(inventoryFormData.parking || '');
      setParkingType(inventoryFormData.parking_type || '');
      setExpVisitTime(inventoryFormData.expVisitTime || '');
      setAvailableDate(inventoryFormData.available_date ? new Date(inventoryFormData.available_date) : null);
    }
  }, [inventoryFormData, type_, setValue]);

  useEffect(() => {
    if (inventory === 'residential') {
      setProjectOptions([
        { label: 'Select Project', value: '' },
        { label: 'Panchsheel Green 1', value: 'Panchsheel Green 1' },
        { label: 'Panchsheel Green 2', value: 'Panchsheel Green 2' },
        { label: 'Ajnara Homes', value: 'Ajnara Homes' },
        { label: 'French Appartment', value: 'French Appartment' },
        { label: 'Gaur Saundryam', value: 'Gaur Saundryam' },
        { label: 'EV 2', value: 'EV 2' },
        { label: 'Cherry County', value: 'Cherry County' },
        { label: 'Aims Green Avenue', value: 'Aims Green Avenue' },
        { label: 'Golf Home', value: 'Golf Home' },
        { label: 'Other', value: 'Other' },
      ]);

      setStatusOptions([
        { label: 'Select ...', value: '' },
        { label: 'Available', value: 'Available' },
        { label: 'Done By Other', value: 'Done By Other' },
        { label: 'Plan Drop Out', value: 'Plan Drop Out' },
        { label: 'Deal Done', value: 'Deal Done' },
      ]);

      setBhkOptions([
        { label: 'Select ...', value: '' },
        { label: '2 BHK', value: '2 BHK' },
        { label: '2BHK + Study', value: '2BHK + Study' },
        { label: '3 BHK', value: '3 BHK' },
        { label: '3BHK + Study', value: '3BHK + Study' },
        { label: '3BHK + Servant', value: '3BHK + Servant' },
        { label: '3BHK + Store', value: '3BHK + Store' },
        { label: '4 BHK', value: '4 BHK' },
        { label: '4 BHK + Study', value: '4 BHK + Study' },
        { label: '4BHK + Servant', value: '4BHK + Servant' },
        { label: '4 BHK + Store', value: '4 BHK + Store' },
      ]);

      setTypeOptions([
        { label: 'Select ...', value: '' },
        { label: 'Raw Flat', value: 'Raw Flat' },
        { label: 'Semi Furnished', value: 'Semi Furnished' },
        { label: 'Fully Furnished', value: 'Fully Furnished' },
      ]);
    } else if (inventory === 'commercial') {
      setProjectOptions([
        { label: 'Select ...', value: '' },
        { label: 'GWSS', value: 'GWSS' },
        { label: 'Civitech Santony', value: 'Civitech Santony' },
        { label: 'Bhutani 62 Avenue', value: 'Bhutani 62 Avenue' },
        { label: 'Golden I', value: 'Golden I' },
        { label: 'NX-One', value: 'NX-One' },
        { label: 'Golden Grande', value: 'Golden Grande' },
        { label: 'Irish Trehan', value: 'Irish Trehan' },
        { label: 'M3M The Line', value: 'M3M The Line' },
        { label: 'Ace YXP', value: 'Ace YXP' },
        { label: 'Ace 153', value: 'Ace 153' },
        { label: 'CRC Flagship', value: 'CRC Flagship' },
        { label: 'EON', value: 'EON' },
        { label: 'Other', value: 'Other' },
      ]);

      setStatusOptions([
        { label: 'Select ...', value: '' },
        { label: 'Available', value: 'Available' },
        { label: 'Done By Other', value: 'Done By Other' },
        { label: 'Plan Drop Out', value: 'Plan Drop Out' },
        { label: 'Deal Done', value: 'Deal Done' },
      ]);

      setBhkOptions([
        { label: 'Select ...', value: '' },
        { label: 'Office Space', value: 'Office Space' },
        { label: 'Studio App', value: 'Studio App' },
        { label: 'Society Shop', value: 'Society Shop' },
        { label: 'Retail Shop', value: 'Retail Shop' },
        { label: 'Industrial land', value: 'Industrial land' },
        { label: 'Commercial land', value: 'Commercial land' },
      ]);

      setTypeOptions([
        { label: 'Select ...', value: '' },
        { label: 'Raw Flat', value: 'Raw Flat' },
        { label: 'Semi Furnished', value: 'Semi Furnished' },
        { label: 'Fully Furnished', value: 'Fully Furnished' },
      ]);
    }
  }, [inventory]);

  const handleAddProject = () => {
    if (newProject) {
      setProjectOptions((prev) => [...prev, { label: newProject, value: newProject }]);
      setNewProject('');
      setAddProject(false);
    }
  };

  const dispatch = useDispatch_();
  const [C_Inventory] = useC_InventoryMutation();

  const onSubmit = async (data: any) => {
    data.inventoryType = inventoryType;
    data.inventory = inventory;
    data.status = status;
    data.tenant = tenant;
    data.landing = landing;
    data.registry = registry;
    data.parking = parking;
    data.parking_type = parkingType;
    data.front = data.front;
    data.height = data.height;
    data.expVisitTime = expVisitTime;
    data.available_date = availableDate;

    try {
      dispatch(loader(true));
      const payload = type_ === 'update' ? data : data;
      const res = await C_Inventory({
        data: payload,
        type_,
        _id: type_ === 'update' ? inventoryFormData._id : '',
      }).unwrap();

      reset();
      setPop(false);
      toast.success('Inventory operation successful');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Inventory operation failed');
    } finally {
      dispatch(loader(false));
    }
  };

  const renderInputField = (
    name: string,
    label: string,
    placeholder: string = '',
    rules: any = {},
    type: string = 'text'
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, value } }) => (
          <input
            type={type}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
        )}
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );

  const renderSelectField = (
    name: string,
    label: string,
    options: Array<{ label: string; value: string }>,
    value: string,
    onChange: (value: string) => void,
    rules: any = {}
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field }) => (
          <select
            {...field}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              field.onChange(e.target.value);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );

  const renderDatePicker = (
    name: string,
    label: string,
    selectedDate: Date | null,
    onChange: (date: Date | null) => void
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange: formOnChange } }) => (
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => {
              onChange(date);
              formOnChange(date ? date.toISOString() : null);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            placeholderText="Select date"
          />
        )}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center overflow-y-auto py-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-4 right-4 bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors"
          onClick={() => setPop(false)}
        >
          <X size={20} className="text-white" />
        </button>

        <h2 className="text-center text-xl font-bold mb-6">
          {type_ === 'update' ? 'Edit Inventory' : 'Add Inventory'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Common fields for all inventory types */}
          {renderInputField('name', 'Name', 'Enter name', { required: 'Name is required' })}
          {renderInputField('mobile', 'Mobile', 'Enter mobile number', {
            required: 'Mobile number is required',
            pattern: {
              value: /^\d{10}$/,
              message: 'Please enter a valid 10-digit mobile number',
            },
          })}
          {/* {renderInputField('email', 'Email', 'Enter email', {
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Please enter a valid email address',
            },
          })} */}
          {renderInputField('email', 'Email', 'Enter email')},

          {/* Inventory Type Selection */}
          {renderSelectField(
            'inventory',
            'Inventory',
            [
              { label: 'Select...', value: '' },
              { label: 'Residential Inventory', value: 'residential' },
              { label: 'Commercial Inventory', value: 'commercial' },
            ],
            inventory,
            setInventory,
            { required: 'Inventory type is required' }
          )}

          {/* Residential Inventory Type */}
          {inventory === 'residential' && renderSelectField(
            'inventoryType',
            'Residential Inventory Type',
            [
              { label: 'Select...', value: '' },
              { label: 'Rent Residential', value: 'Rent Residential' },
              { label: 'Resale Residential', value: 'Resale Residential' },
            ],
            inventoryType,
            setInventoryType,
            { required: 'Inventory type is required' }
          )}

          {/* Commercial Inventory Type */}
          {inventory === 'commercial' && renderSelectField(
            'inventoryType',
            'Commercial Inventory Type',
            [
              { label: 'Select...', value: '' },
              { label: 'Rent Commercial', value: 'Rent Commercial' },
              { label: 'Resale Commercial', value: 'Resale Commercial' },
            ],
            inventoryType,
            setInventoryType,
            { required: 'Inventory type is required' }
          )}

          {/* Project Selection */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              {renderSelectField(
                'project',
                'Project',
                projectOptions,
                watch('project'),
                (value) => setValue('project', value),
                { required: 'Project is required' }
              )}
            </div>
            <button
              type="button"
              onClick={() => setAddProject(!addProject)}
              className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer mb-4"
            >
              <FaPlus size={20} color="#2563EB" />
            </button>
          </div>

          {addProject && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Enter new project name"
              />
              <button
                type="button"
                onClick={handleAddProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          )}

          {/* {renderInputField('unit_no', 'Unit No', 'Enter unit number')} */}
          {renderInputField('unit_no', 'Unit No', 'Enter unit number', { required: 'Unit No is required' })}
          {/* {renderInputField('tower_no', 'Tower No', 'Enter tower number')} */}
          {renderInputField('tower_no', 'Tower No', 'Enter tower number', { required: 'Tower No is required' })}

          {/* BHK Selection */}

          {renderSelectField(
            'bhk',
            inventory === 'commercial' ? 'Commercial Type' : 'BHK',
            bhkOptions,
            watch('bhk'),
            (value) => setValue('bhk', value),
            { required: `${inventory === 'commercial' ? 'Commercial type' : 'BHK'} is required` }
          )}

          {/* Size/Area Field */}
          {/* {renderInputField('area', 'Size', 'Enter size')} */}
          {renderInputField('area', 'Size', 'Enter size', { required: 'Size is required' })}

          {/* Facing Field */}
          {renderInputField('facing', 'Facing', 'Enter facing direction')}

          {/* Commercial-specific fields */}
          {inventory === 'commercial' && (
            <>
              {renderInputField('dimension', 'Depth (ft.)', 'Enter depth', { required: 'Depth is required' })}
              {renderInputField('front', 'Front (ft.)', 'Enter front width', { required: 'Front width is required' })}
              {renderInputField('height', 'Height (ft.)', 'Enter height', { required: 'Height is required' })}

            </>
          )}

          {/* Conditional fields based on inventory type */}
          {(
            <>
              {renderInputField('closing_amount', 'Floor', 'Enter Floor')}
              {renderInputField('demand', 'Demand', 'Enter demand')}
            </>
          )}

          {(inventoryType === 'Rent Residential' || inventoryType === 'Rent Commercial') && (
            renderInputField('expected_rent', 'Expected Rent', 'Enter expected rent')
          )}

          {/* Landing Field */}
          {(inventoryType === 'Resale Residential' || inventoryType === 'Resale Commercial') && renderSelectField(
            'landing',
            'Landing',
            [
              { label: 'Select...', value: '' },
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
            ],
            landing,
            setLanding
          )}

          {landing === 'Yes' && renderInputField('landing_amount', 'Landing Amount', 'Enter landing amount')}

          {/* Registry Field */}
          {(inventoryType === 'Resale Residential' || inventoryType === 'Resale Commercial') && renderSelectField(
            'registry',
            'Registry',
            [
              { label: 'Select...', value: '' },
              { label: 'Done', value: 'Done' },
              { label: 'Transfer Case', value: 'Transfer Case' },
            ],
            registry,
            setRegistry
          )}

          {/* Tenant Field */}
          {renderSelectField(
            'tenant',
            'Tenant',
            [
              { label: 'Select...', value: '' },
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
            ],
            tenant,
            setTenant
          )}

          {tenant === 'Yes' && renderInputField('tenant_mobile_no', 'Tenant Mobile No', 'Enter tenant mobile number')}

          {/* Parking Field */}
          {renderSelectField(
            'parking',
            'Parking',
            [
              { label: 'Select...', value: '' },
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
            ],
            parking,
            setParking
          )}

          {parking === 'Yes' && renderSelectField(
            'parking_type',
            'Parking Type',
            [
              { label: 'Select...', value: '' },
              { label: 'Covered', value: 'Covered' },
              { label: 'Open', value: 'Open' },
            ],
            parkingType,
            setParkingType
          )}

          {/* Expected Visit Time */}
          {/* {renderSelectField(
            'expVisitTime',
            'Expected Visit Time',
            [
              { label: 'Select...', value: '' },
              { label: 'Any Time', value: 'Any Time' },
              { label: 'Weekend', value: 'Weekend' },
              { label: 'Call Before Visit', value: 'Call Before Visit' },
            ],
            expVisitTime,
            setExpVisitTime
          )} */}
          {renderSelectField(
            'expVisitTime',
            'Expected Visit Time',
            [
              { label: 'Select...', value: '' },
              { label: 'Any Time', value: 'Any Time' },
              { label: 'Weekend', value: 'Weekend' },
              { label: 'Call Before Visit', value: 'Call Before Visit' },
            ],
            expVisitTime,
            setExpVisitTime,
            { required: 'Expected Visit Time is required' }
          )}

          {/* Available Date */}
          {renderDatePicker(
            'available_date',
            'Available Date',
            availableDate,
            setAvailableDate
          )}

          {/* Type Selection */}
          {renderSelectField(
            'type',
            'Type',
            typeOptions,
            watch('type'),
            (value) => setValue('type', value),
            { required: 'Type is required' }
          )}

          {/* Status Selection */}
          {renderSelectField(
            'status',
            'Status',
            statusOptions,
            status,
            setStatus,
            { required: 'Status is required' }
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-base"
          >
            {type_ === 'update' ? 'Update Inventory' : 'Add Inventory'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InventoryForm;