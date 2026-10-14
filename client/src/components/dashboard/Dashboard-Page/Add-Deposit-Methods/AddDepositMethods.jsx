import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaTrash, FaEdit, FaSpinner, FaTimes } from "react-icons/fa";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { deleteImage } from "@/hooks/files";

// Reusable Input Field Component
const InputField = ({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`mt-1 p-3 w-full border ${
        value || !required ? "border-gray-300" : "border-red-500"
      } rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
      required={required}
    />
    {required && !value && (
      <p className="mt-1 text-xs text-red-500">This field is required</p>
    )}
  </div>
);

// Reusable Color Picker Component
const ColorPicker = ({ label, name, value, onChange, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="color"
      name={name}
      value={value}
      onChange={onChange}
      className={`mt-1 p-2 w-20 h-10 border ${
        value || !required ? "border-gray-300" : "border-red-500"
      } rounded-lg shadow-sm`}
      required={required}
    />
  </div>
);

// Reusable File Input Component
const FileInput = ({ label, onChange, image, field }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => onChange(e, field)}
      className="mt-1 p-3 w-full border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 shadow-sm"
    />
    {image && (
      <img
        src={`${import.meta.env.VITE_BASE_API_URL}${image}`}
        alt={`${label} Preview`}
        className="mt-3 h-24 w-auto rounded-lg shadow-sm"
      />
    )}
  </div>
);

// Reusable Rich Text Editor Component
const RichTextEditor = ({
  label,
  name,
  value,
  onChange,
  charCount,
  maxLength = 5000,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <ReactQuill
      theme="snow"
      value={value}
      onChange={(content) => onChange({ target: { name, value: content } })}
      className="mt-1 bg-white border border-gray-300 rounded-lg shadow-sm"
      modules={{
        toolbar: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link"],
          ["clean"],
        ],
      }}
      formats={[
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "list",
        "bullet",
        "link",
      ]}
    />
    <p className="mt-1 text-xs text-gray-500">
      {charCount}/{maxLength} characters
    </p>
    {charCount > maxLength && (
      <p className="mt-1 text-xs text-red-500">Character limit exceeded</p>
    )}
  </div>
);

const AddDepositMethods = () => {
  const [depositMethods, setDepositMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    methodNameEN: "",
    methodNameBD: "",
    agentWalletNumber: "",
    agentWalletText: "",
    methodImage: "",
    gateway: [],
    color: "#000000",
    userInputs: [],
    paymentPageImage: "",
    instructionEN: "",
    instructionBD: "",
    status: "active",
    backgroundColor: "#ffffff",
    buttonColor: "#000000",
  });
  const [newGateway, setNewGateway] = useState("");
  const [newUserInput, setNewUserInput] = useState({
    type: "text",
    isRequired: "true",
    label: "",
    labelBD: "",
    fieldInstruction: "",
    fieldInstructionBD: "",
    name: "",
  });
  const [editUserInputIndex, setEditUserInputIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showUserInputModal, setShowUserInputModal] = useState(false);

  // Calculate character counts for instructions
  const instructionENCharCount = formData.instructionEN.replace(
    /<[^>]+>/g,
    ""
  ).length;
  const instructionBDCharCount = formData.instructionBD.replace(
    /<[^>]+>/g,
    ""
  ).length;
  const maxLength = 5000;

  // Fetch all deposit methods
  useEffect(() => {
    const fetchDepositMethods = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BASE_API_URL
          }/depositPaymentMethod/deposit-methods`
        );
        if (!response.ok) throw new Error("Failed to fetch deposit methods");
        const data = await response.json();
        setDepositMethods(data.data);
        setLoading(false);
      } catch {
        toast.error("Failed to load deposit methods.", {
          position: "top-right",
        });
        setLoading(false);
      }
    };
    fetchDepositMethods();
  }, []);

  // Handle text input changes for formData
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle file upload
  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/upload`,
        {
          method: "POST",
          body: uploadFormData,
        }
      );
      if (!response.ok) throw new Error("Failed to upload image");
      const data = await response.json();
      setFormData({ ...formData, [field]: data.filePath });
      toast.success("Image uploaded successfully!", { position: "top-right" });
    } catch {
      toast.error("Failed to upload image.", { position: "top-right" });
    }
  };

  // Handle adding a new gateway
  const addGateway = () => {
    if (newGateway.trim()) {
      setFormData({
        ...formData,
        gateway: [...formData.gateway, newGateway.trim()],
      });
      setNewGateway("");
    }
  };

  // Handle removing a gateway
  const removeGateway = (index) => {
    setFormData({
      ...formData,
      gateway: formData.gateway.filter((_, i) => i !== index),
    });
  };

  // Handle adding or updating a user input
  const addOrUpdateUserInput = () => {
    if (!newUserInput.name.trim()) {
      toast.error("User input name is required.", { position: "top-right" });
      return;
    }

    if (editUserInputIndex !== null) {
      // Update existing user input
      setFormData({
        ...formData,
        userInputs: formData.userInputs.map((input, index) =>
          index === editUserInputIndex ? newUserInput : input
        ),
      });
    } else {
      // Add new user input
      setFormData({
        ...formData,
        userInputs: [...formData.userInputs, newUserInput],
      });
    }

    // Reset user input form
    setNewUserInput({
      type: "text",
      isRequired: "true",
      label: "",
      labelBD: "",
      fieldInstruction: "",
      fieldInstructionBD: "",
      name: "",
    });
    setEditUserInputIndex(null);
  };

  // Handle editing a user input
  const editUserInput = (index) => {
    setNewUserInput(formData.userInputs[index]);
    setEditUserInputIndex(index);
    setShowUserInputModal(true);
  };

  // Handle removing a user input
  const removeUserInput = (index) => {
    if (window.confirm("Are you sure you want to remove this user input?")) {
      setFormData({
        ...formData,
        userInputs: formData.userInputs.filter((_, i) => i !== index),
      });
      toast.success("User input removed successfully.", {
        position: "top-right",
      });
    }
  };

  // Handle user input field changes
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserInput({ ...newUserInput, [name]: value });
  };

  // Handle form submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (
      instructionENCharCount > maxLength ||
      instructionBDCharCount > maxLength
    ) {
      toast.error("Instructions exceed character limit.", {
        position: "top-right",
      });
      return;
    }

    setSaving(true);
    try {
      const url = isEditMode
        ? `${
            import.meta.env.VITE_BASE_API_URL
          }/depositPaymentMethod/deposit-method/${editId}`
        : `${
            import.meta.env.VITE_BASE_API_URL
          }/depositPaymentMethod/deposit-method`;
      const method = isEditMode ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Failed to ${isEditMode ? "update" : "create"} deposit method`
        );
      }

      if (isEditMode) {
        setDepositMethods((methods) =>
          methods.map((method) =>
            method._id === editId ? { _id: editId, ...data.data } : method
          )
        );
      } else {
        setDepositMethods((methods) => [...methods, data.data]);
      }

      toast.success(data.message, { position: "top-right" });
      resetForm();
      setShowForm(false);
    } catch (error) {
      toast.error(error.message || "Failed to save deposit method.", {
        position: "top-right",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle edit deposit method
  const handleEdit = async (id) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_API_URL
        }/depositPaymentMethod/deposit-method/${id}`
      );
      if (!response.ok) throw new Error("Failed to fetch deposit method");
      const data = await response.json();
      setFormData(data.data);
      setEditId(id);
      setIsEditMode(true);
      setShowForm(true);
    } catch {
      toast.error("Failed to load deposit method.", { position: "top-right" });
    }
  };

  // Handle delete deposit method
  const handleDelete = async ({ id, paymentPageImage, methodImage }) => {
    if (
      window.confirm("Are you sure you want to delete this deposit method?")
    ) {
     // console.log("click delete ", paymentPageImage, methodImage, id);

      if (paymentPageImage || methodImage) {
        try {
          paymentPageImage &&
            (await deleteImage(paymentPageImage.split("/").pop()));
          methodImage && (await deleteImage(methodImage.split("/").pop()));
        } catch (error) {
          console.warn("Failed to delete deposit method images", error);
        }
      }

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BASE_API_URL
          }/depositPaymentMethod/deposit-method/${id}`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error("Failed to delete deposit method");
        setDepositMethods(depositMethods.filter((method) => method._id !== id));
        toast.success("Deposit method deleted successfully.", {
          position: "top-right",
        });
      } catch {
        toast.error("Failed to delete deposit method.", {
          position: "top-right",
        });
      }
    }
  };

  // Reset form and modal
  const resetForm = () => {
    setFormData({
      methodNameEN: "",
      methodNameBD: "",
      agentWalletNumber: "",
      agentWalletText: "",
      methodImage: "",
      gateway: [],
      color: "#000000",
      userInputs: [],
      paymentPageImage: "",
      instructionEN: "",
      instructionBD: "",
      status: "active",
      backgroundColor: "#ffffff",
      buttonColor: "#000000",
    });
    setNewGateway("");
    setNewUserInput({
      type: "text",
      isRequired: "true",
      label: "",
      labelBD: "",
      fieldInstruction: "",
      fieldInstructionBD: "",
      name: "",
    });
    setEditUserInputIndex(null);
    setIsEditMode(false);
    setEditId(null);
    setShowUserInputModal(false);
  };

  // Handle modal save
  const handleModalSave = () => {
    if (newUserInput.name.trim()) {
      addOrUpdateUserInput();
    }
    setShowUserInputModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Deposit Payment Methods
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
            setIsEditMode(false);
          }}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition duration-200 shadow-md"
        >
          <FaPlus className="mr-2" /> Add New Method
        </button>
      </div>

      {/* Deposit Methods Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden mb-8">
        {depositMethods.length === 0 ? (
          <p className="p-6 text-gray-600 text-center">
            No deposit methods found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Method Name (EN)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Method Name (BD)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {depositMethods.map((method) => (
                  <tr
                    key={method._id}
                    className="hover:bg-gray-50 transition duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {method.methodNameEN}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {method.methodNameBD}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          method.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {method.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEdit(method._id)}
                        className="text-blue-500 hover:text-blue-700 mr-4"
                        title="Edit Method"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete({
                            id: method._id,
                            methodImage: method.methodImage,
                            paymentPageImage: method.paymentPageImage,
                          })
                        }
                        className="text-red-500 hover:text-red-700"
                        title="Delete Method"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form for Creating/Editing Deposit Method */}
      {showForm && (
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {isEditMode
              ? "Edit Deposit Payment Method"
              : "Add Deposit Payment Method"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Method Name (EN) */}
              <InputField
                label="Method Name (EN)"
                name="methodNameEN"
                value={formData.methodNameEN}
                onChange={handleInputChange}
                required
              />

              {/* Method Name (BD) */}
              <InputField
                label="Method Name (BD)"
                name="methodNameBD"
                value={formData.methodNameBD}
                onChange={handleInputChange}
                required
              />

              {/* Agent Wallet Number */}
              <InputField
                label="Agent Wallet Number"
                name="agentWalletNumber"
                value={formData.agentWalletNumber}
                onChange={handleInputChange}
                required
              />

              {/* Agent Wallet Text */}
              <InputField
                label="Agent Wallet Text"
                name="agentWalletText"
                value={formData.agentWalletText}
                onChange={handleInputChange}
                required
              />

              {/* Method Image */}
              <FileInput
                label="Method Image"
                onChange={handleFileUpload}
                image={formData.methodImage}
                field="methodImage"
              />

              {/* Payment Page Image */}
              <FileInput
                label="Payment Page Image"
                onChange={handleFileUpload}
                image={formData.paymentPageImage}
                field="paymentPageImage"
              />

              {/* Gateway */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Gateways
                </label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={newGateway}
                    onChange={(e) => setNewGateway(e.target.value)}
                    className="p-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="Enter gateway (e.g., সেন্ড মানি, AP-ক্যাশ আউট, EP-ক্যাশ আউট)"
                  />
                  <button
                    type="button"
                    onClick={addGateway}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition duration-200 shadow-sm"
                  >
                    <FaPlus className="mr-2" /> Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.gateway.map((gw, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 rounded-lg px-3 py-1 text-sm shadow-sm"
                    >
                      <span>{gw}</span>
                      <button
                        type="button"
                        onClick={() => removeGateway(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color */}
              <ColorPicker
                label="Color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
              />

              {/* Background Color */}
              <ColorPicker
                label="Background Color"
                name="backgroundColor"
                value={formData.backgroundColor}
                onChange={handleInputChange}
                required
              />

              {/* Button Color */}
              <ColorPicker
                label="Button Color"
                name="buttonColor"
                value={formData.buttonColor}
                onChange={handleInputChange}
                required
              />

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Instruction (EN) */}
            <RichTextEditor
              label="Instruction (EN)"
              name="instructionEN"
              value={formData.instructionEN}
              onChange={handleInputChange}
              charCount={instructionENCharCount}
              maxLength={maxLength}
            />

            {/* Instruction (BD) */}
            <RichTextEditor
              label="Instruction (BD)"
              name="instructionBD"
              value={formData.instructionBD}
              onChange={handleInputChange}
              charCount={instructionBDCharCount}
              maxLength={maxLength}
            />

            {/* User Inputs Section */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setEditUserInputIndex(null);
                  setNewUserInput({
                    type: "text",
                    isRequired: "true",
                    label: "",
                    labelBD: "",
                    fieldInstruction: "",
                    fieldInstructionBD: "",
                    name: "",
                  });
                  setShowUserInputModal(true);
                }}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition duration-200 shadow-sm"
              >
                <FaPlus className="mr-2" /> Add User Input
              </button>
              {formData.userInputs.length > 0 && (
                <div className="mt-4 space-y-3">
                  {formData.userInputs.map((input, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Name: {input.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Type: {input.type}
                        </p>
                        <p className="text-sm text-gray-600">
                          Required: {input.isRequired === "true" ? "Yes" : "No"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Label (EN): {input.label || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Label (BD): {input.labelBD || "N/A"}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => editUserInput(index)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit User Input"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeUserInput(index)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove User Input"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-400 text-white rounded-lg hover:from-gray-600 hover:to-gray-500 transition duration-200 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition duration-200 shadow-sm"
              >
                {saving ? (
                  <FaSpinner className="mr-2 animate-spin" />
                ) : (
                  <FaPlus className="mr-2" />
                )}
                {saving
                  ? "Saving..."
                  : `${isEditMode ? "Update" : "Create"} Deposit Method`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Inputs Modal */}
      {showUserInputModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl relative">
            <button
              onClick={() => setShowUserInputModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              title="Close"
            >
              <FaTimes />
            </button>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              {editUserInputIndex !== null
                ? "Edit User Input"
                : "Add User Input"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  name="type"
                  value={newUserInput.type}
                  onChange={handleUserInputChange}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="file">File</option>
                </select>
              </div>

              {/* Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Required
                </label>
                <select
                  name="isRequired"
                  value={newUserInput.isRequired}
                  onChange={handleUserInputChange}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {/* Label (EN) */}
              <InputField
                label="Label (EN)"
                name="label"
                value={newUserInput.label}
                onChange={handleUserInputChange}
              />

              {/* Label (BD) */}
              <InputField
                label="Label (BD)"
                name="labelBD"
                value={newUserInput.labelBD}
                onChange={handleUserInputChange}
              />

              {/* Field Instruction (EN) */}
              <InputField
                label="Field Instruction (EN)"
                name="fieldInstruction"
                value={newUserInput.fieldInstruction}
                onChange={handleUserInputChange}
              />

              {/* Field Instruction (BD) */}
              <InputField
                label="Field Instruction (BD)"
                name="fieldInstructionBD"
                value={newUserInput.fieldInstructionBD}
                onChange={handleUserInputChange}
              />

              {/* Name */}
              <div className="col-span-2">
                <InputField
                  label="Name"
                  name="name"
                  value={newUserInput.name}
                  onChange={handleUserInputChange}
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={addOrUpdateUserInput}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition duration-200 shadow-sm"
              >
                <FaPlus className="mr-2" />{" "}
                {editUserInputIndex !== null ? "Update" : "Add"} User Input
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUserInputModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-400 text-white rounded-lg hover:from-gray-600 hover:to-gray-500 transition duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleModalSave}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition duration-200 shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddDepositMethods;
