const Type = require('../models/TypeSchema');
const cloudinary = require('../utils/cloudinary');

// Get all types
exports.getAllTypes = async (req, res) => {
    try {
      const types = await Type.find();
      res.status(200).json({
        message:"fetch category successfully",
        data:types
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.getAllTypesforTypes = async (req, res) => {
    try {
      const types = await Type.find();
      res.status(200).json(
        types
      );
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Get type by ID
  exports.getTypeById = async (req, res) => {
    try {
      const type = await Type.findById(req.params.id);
      if (!type) {
        return res.status(404).json({ message: 'Type not found' });
      }
      res.status(200).json(type);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.createType = async (req, res) => {
    try {
      const { name, description } = req.body;
  
      // Check if the type already exists
      const existingType = await Type.findOne({ name });
      if (existingType) {
        return res.status(400).json({ message: "Type already exists" });
      }
  
      let image = "";
  
      // ✅ Handle Cloudinary Image Upload Properly Inside This Function
      if (req.file) {
        try {
          image = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: "types" }, (error, result) => {
              if (error) {
                console.error("Cloudinary Upload Error:", error);
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            });
            stream.end(req.file.buffer); // Send the image buffer to Cloudinary
          });
        } catch (uploadError) {
          console.error("Cloudinary Upload Failed:", uploadError);
          return res.status(500).json({ message: "Image upload failed", error: uploadError.message });
        }
      }
  
      // ✅ Create and Save the New Type
      const newType = new Type({ name, description, image });
      await newType.save();
  
      res.status(201).json({ message: "Type created successfully", type: newType });
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };
  
  // Update type with new image upload
  exports.updateType = async (req, res) => {
    try {
      const { name, description } = req.body;
      const type = await Type.findById(req.params.id);
  
      if (!type) {
        return res.status(404).json({ message: 'Type not found' });
      }
  
      let updatedFields = { name, description };
  
      if (req.file) {
        // Delete old image from Cloudinary
        if (type.image) {
          const publicId = type.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
  
        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'types' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          ).end(req.file.buffer);
        });
  
        updatedFields.image = result;
      }
  
      // Update type in the database
      const updatedType = await Type.findByIdAndUpdate(req.params.id, updatedFields, {
        new: true,
        runValidators: true,
      });
  
      res.status(200).json(updatedType);
    } catch (error) {
      res.status(500).json({ message: 'Error updating type', error: error.message });
    }
  };
  
  // Delete type by ID
  exports.deleteType = async (req, res) => {
    try {
      const type = await Type.findById(req.params.id);
      if (!type) {
        return res.status(404).json({ message: 'Type not found' });
      }
  
      // Delete image from Cloudinary
      if (type.image) {
        const publicId = type.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
  
      // Delete type from the database
      await Type.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Type deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting type', error: error.message });
    }
  };