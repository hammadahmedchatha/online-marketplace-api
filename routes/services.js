const {Service} = require('../models/service');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if(isValid) {
            uploadError = null
        }
      cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
        
      const fileName = file.originalname.split(' ').join('-');
      const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })
  
const uploadOptions = multer({ storage: storage })

router.get(`/`, async (req, res) =>{
    let filter = {};
    if(req.query.categories)
    {
         filter = {category: req.query.categories.split(',')}
    }

    const serviceList = await Service.find(filter).populate('category');

    if(!serviceList) {
        res.status(500).json({success: false})
    } 
    res.send(serviceList);
})

router.get(`/:id`, async (req, res) =>{
    const service = await Service.findById(req.params.id).populate('category');

    if(!service) {
        res.status(500).json({success: false})
    } 
    res.send(service);
})

router.post(`/`, uploadOptions.single('image'), async (req, res) =>{
    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Invalid Category')

    // const file = req.file;
    // if(!file) return res.status(400).send('No image in the request')

    // const fileName = file.filename
    // const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    let service = new Service({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.richDescription, //`${basePath}${fileName}`,// "http://localhost:3000/public/upload/image-2323232"
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    })

    service = await service.save();

    if(!service) 
    return res.status(500).send('Service cannot be created')

    res.send(service);
})

router.put('/:id',async (req, res)=> {
    if(!mongoose.isValidObjectId(req.params.id)) {
       return res.status(400).send('Invalid Service Id')
    }
    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Invalid Category')

    const service = await Sroduct.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: req.body.image,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        { new: true}
    )

    if(!service)
    return res.status(500).send('the service cannot be updated!')

    res.send(service);
})

router.delete('/:id', (req, res)=>{
    Service.findByIdAndRemove(req.params.id).then(service =>{
        if(service) {
            return res.status(200).json({success: true, message: 'the service is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "service not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

router.get(`/get/count`, async (req, res) =>{
    const serviceCount = await Service.countDocuments((count) => count)

    if(!serviceCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        serviceCount: serviceCount
    });
})

router.get(`/get/featured/:count`, async (req, res) =>{
    const count = req.params.count ? req.params.count : 0
    const services = await Service.find({isFeatured: true}).limit(+count);

    if(!services) {
        res.status(500).json({success: false})
    } 
    res.send(services);
})

router.put(
    '/gallery-images/:id', 
    uploadOptions.array('images', 10), 
    async (req, res)=> {
        if(!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid service Id')
         }
         const files = req.files
         let imagesPaths = [];
         const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

         if(files) {
            files.map(file =>{
                imagesPaths.push(`${basePath}${file.filename}`);
            })
         }

         const service = await Service.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths
            },
            { new: true}
        )

        if(!service)
            return res.status(500).send('the gallery cannot be updated!')

        res.send(service);
    }
)

module.exports =router;