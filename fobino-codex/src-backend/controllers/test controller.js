// const User = require('../models/User')
// const express =require('express')


// exports.testStart= ascync (res, req)=>{
// const {user , test} = req.body
// const {testImage}=req.file
// if(!user | !test | !testImage){
//     res.json.stringify('requirements not found')
// }
// newUser = new User {
//     user._id:userId
//     // test : testSchrema:importedFromTestModel 
//     user.schema:User.findById(user.id)
//     testImage:testImage
//   }
// }

// exprots.testEnd = async (res , req)=>{
//     const {endTime , startTime}= req.body
//     const {uploadedImage}= req.file
// }


// import express from 'express'
// import mongoose from 'mongoose'
// import User from '../models/User'
// exports.getUserTest = async (res , res)=>{
//     const{user , tests} = req.body
//     const {testImage}= req.file
//     if(!user){
//         res.json.strigify('user not found')

//     }
//     if (!tests){
//         res.json.stringify('tests data not found ')
//     }
//     if (!testImage){
//         res.json.stringify('test images required')
//     }
//     // const existingUser = user.findById({$user._id})
//     const newUser = new User ({
//         user:user._id,
//         test:tests,
//         testImage:multer.parse
        
//     })
// }


// import User from '../models/User'
// import express from 'express'
// import mongoose from 'mongoose'

// const testSchema = new mongoose ({

// })
// const User = require('../models/User')

// exports.createTest = async (req , res)=>{
//    const {user}= req.params
//    const foundedUser = user.findById({'user'})
//    if (!foundedUser){
//     res.json.stringify('user not found')
//    }
//    const new User = ({
//     user:foundedUser,
//     tests:'test succefull',
//     foundedUser:'system founded the user'
//    })
// }
// class user extends foundedUser {
//  const user = {
//     this.user = 'systemuser',
//     this.test= 'test succesfull'
//     const newClassUser= {
//         user: foundedUser,
//         test: 'test succefull'
//     }
//  }
// }

// import User from '../models/User'
// import express from 'express'
// import mongoose from 'mongoose'

// exports.getTestResult = async (req , res)=>{
//     const {user}= req.params
//     const foundedUser = user.findById({'user'})
//     if (!foundedUser){
//         res.json.stringify('user not found')
//     }
//     const new User = ({
//         user:foundedUser,
//         testResult:'test result succefull',
//         foundedUser:'system founded the user'
//     })
// }


// eports.getNewTests = async (req , res)=>{
//     const {user}= req.params
//     const foundedUser = user.findById({'user'})
//     if(!foundedUser){
//         res.json.stringify('user not found')
//     }
//     const newTest = ({
//         user:foundedUser,
//         tests:'new tests created',
//         foundedUser: "system founded tested user"
//     })
// }