import User from "../models/Users.js";

// ============================================
// GET ALL MEMBERS (Employees only)
// ============================================
export const getAllMembers = async (req, res) => {
  try {
    const members = await User.find({ role: "employee" })
      .select("-password")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Get Members Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE MEMBER
// ============================================
export const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await User.findById(id).select("-password");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error("Get Member Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE MEMBER
// ============================================
export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, skill } = req.body;

    const member = await User.findByIdAndUpdate(
      id,
      { name, email, skill },
      { new: true }
    ).select("-password");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error("Update Member Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE MEMBER
// ============================================
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await User.findByIdAndDelete(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error) {
    console.error("Delete Member Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};