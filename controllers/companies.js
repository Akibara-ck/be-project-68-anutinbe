const Company = require('../models/Company');
const Interview = require('../models/Interview');
// @desc      Get all companies
// @route     GET /api/v1/companies

exports.getCompanies = async (req, res, next) => {
    let query;

    //copy req query
    const reqQuery = {...req.query};

    //exclude field
    const removeFields = ['select', 'sort', 'page', 'limit', 'tags', 'search'];

    //loop over remove field and del them from req query
    removeFields.forEach(params=>delete reqQuery[params] );


    //create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr=queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,match=>`$${match}`);
    query = Company.find(JSON.parse(queryStr)).populate('interviews');

    //select query
    if(req.query.select){
        const fields = req.query.select.split(',').join(' ');
        query=query.select(fields);
    }

    //sort
    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        query=query.sort(sortBy);
    }else{
        query=query.sort('-createdAt');
    }

    //tags
    if(req.query.tags){
        const tags = Object.entries(req.query.tags)
            .map(([key, values]) => {return {[`$${key}`]: values.split(',')}})[0]
        query=query.find({tags:tags});
    }

    if(req.query.search){
        query=query.find({name:{$regex:req.query.search, $options:'i'}});
    }

    //Pagination
    const limit = parseInt(req.query.limit,10)||25;
    const total = await query.clone().countDocuments();
    const totalPages = Math.ceil(total/limit) || 1;
    const page = (parseInt(req.query.page,10)>totalPages)?totalPages:parseInt(req.query.page,10)||1;
    const startIndex=(page-1)*limit;
    const endIndex=page*limit;

    query=query.skip(startIndex).limit(limit);

    try{
        const companies = await query;

        const pagination ={};
        if(endIndex<total){
            pagination.next={
                page:page+1,
                limit
            }
        }

        if (startIndex>0){
            pagination.prev={
                page:page-1,
                limit
            }
        }

        res.status(200).json({
            success:true,
            count:companies.length,
            totalPages,
            totalCount:total,
            pagination,
            data:companies});
    }catch(err){
        res.status(400).json({success:false});
    }
};

// @desc      Get single company
// @route     GET /api/v1/companies/:id

exports.getCompany = async (req, res, next) => {
    try{
        const company = await Company.findById(req.params.id).populate('interviews');

        if(!company){
            res.status(400).json({success:false});
        }

        res.status(200).json({success:true,data:company});
    }catch(err){
            res.status(400).json({success:false});
        }
};

// @desc      Create new company
// @route     POST /api/v1/companies

exports.createCompany = async (req, res, next) => {
    console.log(req.body);
    const company = await Company.create(req.body);
    res.status(201).json({
        success:true,
        data:company
    });
};

// @desc      Update company
// @route     PUT /api/v1/companies/:id

exports.updateCompany = async(req, res, next) => {

    try{
        const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
            new:true,
            runValidators:true
        });

        if(!company){
            return res.status(400).json({success:false});
        }

        res.status(200).json({success:true,data:company});
    }catch(err){
            res.status(400).json({success:false});
        }

    //res.status(200).json({ success: true, msg: `Update hospital ${req.params.id}` });
};

// @desc      Delete company
// @route     DELETE /api/v1/companies/:id

exports.deleteCompany = async(req, res, next) => {
    try{
        const company = await Company.findById(req.params.id);

        if(!company){
            res.status(400).json({success:false});
        }
        await Interview.deleteMany({ company: req.params.id });
        await Company.deleteOne({ _id: req.params.id });

        res.status(200).json({success:true,data:{}});
    }catch(err){
            res.status(400).json({success:false});
        }

};