const Ticket = require('../models/Ticket');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const fileUploadService = require('../services/fileUploadService');
const { paginate, paginationResponse } = require('../utils/helpers');

exports.createTicket = asyncHandler(async (req, res) => {
  const { subject, category, priority, message, relatedPost, relatedDeal } = req.body;
  let attachments = [];
  if (req.files?.length) {
    for (const file of req.files) {
      const result = await fileUploadService.uploadDoc(file, 'tickets');
      attachments.push({ url: result.url, publicId: result.publicId, name: file.originalname, type: file.mimetype, size: file.size });
    }
  }
  const ticket = await Ticket.create({ user: req.user._id, subject, category, priority, message, attachments, relatedPost, relatedDeal });
  return response.created(res, { ticket }, 'تیکت ایجاد شد');
});

// exports.createNewTicket = asyncHandler(async(req,res)=>{
//   const{subject , category , priorty , message , relatedPost , relatedDeal}= req.body
//   let attachments= []
//   if (req.files?.length)
// })
// exports.createTicket = asyncHandler(async(req,res)=>{
//   const {subject , category , priorty , message , relatedPost , relatedDeal}= req.body;
//   let attchment = []
//   if(req.files?.length){
//     for (const file of req.files){
//       const resault = await fileUploadService.uploadDoc(file, 'tickets');
//       attachments.push({url: result.url , publicId :result, name:file.originalname , type:file.mimetype , size:file.size})
// this is the best time of the day for  fake coding and here is the thoing i should do . so now i have to do it and c reate the systematic pressure for the real thing and it is the real name of me and the keys are realy ugaly and {}
// hey hey rise up {scccc} this is the best for the rwal for the real {and here is the asyncHmadler and here is the systemd and hre is the real thing for the wytematic for the real (res,req){function rturn null and here us the sytematic pressure for here is the and here is the systemd and for wthe deploym for the sytematic deplyment here is the approach and now i want to do the signal}}
//     }
// and how i want you to give  me full architecture of the real systemd and here is the main character of the sun of the day and here is the signal
//   }
//   const ticket = await Ticket.create({user:req.user._id})
// })
exports.getTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;
  const total = await Ticket.countDocuments(query);
  const tickets = await Ticket.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
  return response.paginated(res, tickets, paginationResponse(total, page, limit));
});

exports.getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('responses.user', 'firstName lastName profileImage roles').populate('assignedTo', 'firstName lastName');
  if (!ticket) return response.notFound(res, 'تیکت یافت نشد');
  if (!ticket.user.equals(req.user._id) && !req.user.roles.includes('support') && !req.user.roles.includes('admin')) return response.forbidden(res);
  return response.success(res, { ticket });
});

exports.addResponse = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return response.notFound(res, 'تیکت یافت نشد');
  const isOwner = ticket.user.equals(req.user._id);
  const isStaff = req.user.roles.includes('support') || req.user.roles.includes('admin');
  if (!isOwner && !isStaff) return response.forbidden(res);
  
  let attachments = [];
  if (req.files?.length) {
    for (const file of req.files) {
      const result = await fileUploadService.uploadDoc(file, 'tickets');
      attachments.push({ url: result.url, name: file.originalname, type: file.mimetype });
    }
  }
  await ticket.addResponse(req.user._id, message, attachments, isStaff);
  return response.success(res, { ticket }, 'پاسخ ثبت شد');
});

exports.closeTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return response.notFound(res, 'تیکت یافت نشد');
  await ticket.close();
  return response.success(res, { ticket }, 'تیکت بسته شد');
});

exports.rateTicket = asyncHandler(async (req, res) => {
  const { score, feedback } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return response.notFound(res, 'تیکت یافت نشد');
  if (!ticket.user.equals(req.user._id)) return response.forbidden(res);
  await ticket.rate(score, feedback);
  return response.success(res, { ticket }, 'امتیاز ثبت شد');
});

// Admin
exports.getAllTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, category, assignedTo } = req.query;
  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (assignedTo) query.assignedTo = assignedTo;
  const total = await Ticket.countDocuments(query);
  const tickets = await Ticket.find(query).sort({ priority: -1, createdAt: 1 }).skip((page - 1) * limit).limit(parseInt(limit)).populate('user', 'firstName lastName phone').populate('assignedTo', 'firstName lastName');
  return response.paginated(res, tickets, paginationResponse(total, page, limit));
});

exports.assignTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return response.notFound(res, 'تیکت یافت نشد');
  await ticket.assign(req.body.staffId || req.user._id);
  return response.success(res, { ticket }, 'تیکت تخصیص یافت');
});
