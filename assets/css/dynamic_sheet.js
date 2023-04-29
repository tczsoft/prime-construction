import dynamicSchema from '../models/dynamicmodel.js';
import staticSchema from '../models/allmodels.js';
import moment from 'moment-timezone';
import csvtojson from 'csvtojson';
import { fail } from 'assert';
import con2 from '../db/db2.js';
async function findonequery(db,collection,findq,get_col){
try{
    var data = await dynamicSchema(collection,db).findOne(findq,get_col).lean();
    return data;
}
catch(err){
    console.log(err);
}
}
async function findallquery(db,collection,findq,get_col){
    try{
        var data = await dynamicSchema(collection,db).find(findq,get_col);
        return data;
    }
    catch(err){
        console.log(err);
    }
    }
async function updatemany(db,collection,udadateq,query){
    try{
        var data = await dynamicSchema(collection,db).updateMany(udadateq,query);
        return data;
    }
    catch(err){
        console.log(err);
    }
}

async function savehistory(data,id,collection) {
try{
    var objassign = { ...data, ...{ o_id :id.toString()} }
    var news = await new dynamicSchema(collection,'versionhistory')(objassign).save();
}
catch(err){
    console.log(err);
}
    
}

async function oldsavehistory(data, id, collection) {
try{
    var objassign = { o_id: id.toString() };
    
      var news = await new dynamicSchema(collection,'versionhistory')(objassign);
      news.save(function (err, resdata) { 
      if (err){
        res.send("dd")
      }
      else {
        updatehistory(data, id,collection);
   
      }
  
    });
}
catch(err){
    console.log(err);
}
    
}

async function updatehistory(data, id, collection) {

try{
    var check = await dynamicSchema(collection,'versionhistory').findOne({ o_id: id.toString() }).lean();
    if (check == null) {
      oldsavehistory(data, id, collection)
    }
    else {
        await dynamicSchema(collection,'versionhistory').updateOne({ o_id: id.toString() }, { $push: data });
       
    }
}
catch(err){
    console.log(err);
}
    
  }

//Read
const get = async (req,res,next)=>{
try{
    var query = JSON.parse(req.query.q);
    var condition = JSON.parse(req.query.c);
    var get_customer;

    if(condition && condition.parent_folder != null){
        var get_folder_id = await staticSchema["folder"].findOne({router_name : condition.parent_folder}).lean()
        query.data = {...query.data,...{parent_folder_id : get_folder_id['folder_id']}}
    }
    get_customer = await staticSchema[query.collection].find(query.data,query.purpose == "get_column" && req.user.data.Role == 'Developer'?{}:{'read_policy':0,'save_policy':0,'update_policy':0})

    if(query.purpose == "get_column"){
       
        var view_access = (get_customer[0].table_head).filter(res => res.view_access!=undefined&&res.view_access.indexOf(req.user.data.Employee_Email) >= 0 || res.view_access.indexOf('all') >=0);
        var add_access = (get_customer[0].table_head).filter(res => res.add_access!=undefined&&res.add_access.indexOf(req.user.data.Employee_Email) >= 0);
        var edit_access = (get_customer[0].table_head).filter(res => res.edit_access!=undefined&&res.edit_access.indexOf(req.user.data.Employee_Email) >= 0);
        var filter_access = (get_customer[0].table_head).filter(res => res.filter_access!=undefined&&res.filter_access.indexOf(req.user.data.Employee_Email) >= 0);
        var dynamic_form_access = (get_customer[0].table_head).filter(res => res.dynamic_form_access!=undefined&&res.dynamic_form_access.indexOf(req.user.data.Employee_Email) >= 0);
        get_customer[0].table_head = {view_access : view_access, add_access : add_access, edit_access : edit_access,filter_access:filter_access,dynamic_form_access:dynamic_form_access}
    }
    res.send(get_customer)
}
catch(err){
    console.log(err);
}
}

//folder and file Save
const folder_file_save = async (req,res,next)=>{
try{
    var io = req.app.get('socketio');
    if(req.body.condition != null){
        var get_folder_id = await staticSchema["folder"].findOne(req.body.condition).lean();
        req.body.data = {...req.body.data,...{parent_folder_id : get_folder_id['folder_id']}};
    }
    if(req.body.collection == 'tables')
    {
       await dynamicSchema(req.body.data.collection_name,req.body.data['database']);
    }
    var store_table = await new staticSchema[req.body.collection](req.body.data).save();
    var response = {room : req.body.room, data : store_table}
    io.to(req.body.room).emit('save', response);
    res.send(response);
}
catch(err){
    console.log(err);
}
}


//Update
const folder_file_update = async (req,res,next)=>{
try{
    var io = req.app.get('socketio');
    var edit_customer = await staticSchema[req.body.collection].updateOne({'_id': req.body.id},{$set : req.body.data});
    var customer_update = await staticSchema[req.body.collection].findOne({'_id': req.body.id});
    var response = {room : req.body.room, data : customer_update}
    io.to(req.body.room).emit('update', response);
    res.send(response)
}
catch(err){
    console.log(err);
}
    
}

//Delete
const folder_file_remove = async (req,res,next)=>{
try{
    var io = req.app.get('socketio');
    var delete_customer = await staticSchema[req.body.collection].deleteOne({'_id': req.body.id})
    var response = {room : req.body.room, id : req.body.id} 
    io.to(req.body.room).emit('delete', response);
    res.send(delete_customer);
}
catch(err){
    console.log(err);
}
}

//add column
const add_Column = async (req,res,next)=>{
try{
    var io = req.app.get('socketio');
    var get_table_id;
    if(req.body.condition != null){
        get_table_id = await staticSchema["tables"].findOne(req.body.condition).lean();
    }
    var edit_customer = await staticSchema[req.body.collection].updateOne({'_id' : get_table_id['_id'],router : req.body.condition.router},{$push : req.body.data});
    var response = {room : req.body.room, data : req.body.data.table_head}
    io.to(req.body.room).emit('save', response);
    res.send(response);
}
catch(err){
    console.log(err);
}
}

//update column
const edit_Column = async (req,res,next)=>{
try{
    var io = req.app.get('socketio');
    var get_table_id;
    if(req.body.condition != null){
        get_table_id = await staticSchema["tables"].findOne(req.body.condition).lean()
    } 

    var edit_customer = await staticSchema[req.body.collection].updateOne({'_id' : get_table_id['_id'], "table_head.field" : req.body.field},{$set : {'table_head.$' : req.body.data}})
    var response = {room : req.body.room, data : req.body.data}
    io.to(req.body.room).emit('update', response);
    res.send(response)

}
catch(err){
    console.log(err);
}
}

//Delete column
const remove_Column = async (req,res,next)=>{
try{
    var io = req.app.get('socketio');
    var get_table_id;
    if(req.body.condition != null){
        get_table_id = await staticSchema["tables"].findOne(req.body.condition).lean()
    } 
    var edit_customer = await staticSchema[req.body.collection].updateOne({'_id' : get_table_id['_id']},{$pull:{'table_head':{'field' : req.body.data['field']}}},{multi:true})
    var response = {room : req.body.room, data : req.body.data}
    io.to(req.body.room).emit('delete', response);
    res.send(response)
}
catch(err){
    console.log(err);
}
}

//Dynamic Table Normal read
const normal_read = async (req,res,next)=>{
    try{
    var condition = JSON.parse(req.query.c);
    var get_collection = await staticSchema["tables"].findOne(condition).lean();
    if(get_collection['table_method']=='aggregate'){
       aggregate_read(req,res,next);
    }
    else{
        simpleread(req,res,next);
    }
}
catch(err){
    console.log(err);
}
}
//simple read
const simpleread= async (req,res,next)=>{
    try{
    var condition = JSON.parse(req.query.c);
    var get_collection = await staticSchema["tables"].findOne(condition).lean();
    var get_col = get_collection['table_head'].filter(res => res.view_access!==undefined&&res.view_access.indexOf(req.user.data.Employee_Email) >= 0||res.edit_access!==undefined&&res.edit_access.indexOf(req.user.data.Employee_Email) >= 0);
    var ObjAssgin = Object.assign({},...get_col.map(res => ({[res.field] : 1})));
    var stringfun = get_collection['read_policy'];
    var fun = eval("(" + stringfun + ")");
    var query=await fun();
    var get_Data;
    if(query.sort==true){
        get_Data=await dynamicSchema(get_collection['collection_name'],get_collection['database']).find(query.data,ObjAssgin).sort(query.sortfield);
    }
    else{
        get_Data = await dynamicSchema(get_collection['collection_name'],get_collection['database']).find(query.data,ObjAssgin);
    }
    res.send(get_Data)
}
catch(err){
    console.log(err);
}
}
//Dynamic Table Aggregate read
const aggregate_read = async (req,res,next)=>{
    try{
    var query;
    var condition = JSON.parse(req.query.c)
    var get_collection=await staticSchema["tables"].findOne(condition).lean();
    var user = req.user.name;
    var stringfun = get_collection['read_policy'];
    var fun = eval("(" + stringfun + ")");
    var query=await fun();
    if (JSON.stringify(query)=='{}'){
        simpleread(req,res,next);
    }
    else{
        var get_Data = await dynamicSchema(get_collection['collection_name'],get_collection['database']).aggregate(query)
        res.send(get_Data)
    }
}
catch(err){
    console.log(err);
}
}

//Save
const save = async (req,res,next)=>{
    try{
    var io = req.app.get('socketio');
    var db = req.body.db;
    var get_collection;
    if(req.body.condition != null){
        get_collection = await staticSchema["tables"].findOne(req.body.condition).lean();
    }

    var save_data = req.body.data;
    //console.log(typeof get_collection['save_policy']);
    var stringfun = get_collection['save_policy'];
    var fun = eval("(" + stringfun + ")");
    var sample=await fun();
    var get_Data = await dynamicSchema(get_collection['collection_name'],db)(sample).save();
    console.log(get_Data)
    req.body.history!=null?savehistory(req.body.history,get_Data._id,get_collection['collection_name']+'-history'):true;
    var response = {room : req.body.room, data : get_Data}
    io.to(req.body.room).emit('save', response);
    res.send(response)
}
catch(err){
    console.log(err);
}
}

//Edit
const update = async (req,res,next)=>{
    try{
    var io = req.app.get('socketio');
    var upd_data = req.body.data;
    var db = req.body.db;
    var get_collection;
    console.log(req.body)
    if(req.body.condition != null){
        get_collection = await staticSchema["tables"].findOne(req.body.condition).lean();

        var allowed = (get_collection['table_head'].filter(res => res.elementtype == 'date')).map(res => res.field);
        var filter = Object.keys(upd_data).filter(key => allowed.includes(key)).reduce((obj, key) => { obj[key] = upd_data[key]; return obj; }, {});
        var convert_data = Object.entries(filter).map(([k,v]) => {return {[k] : `${moment(new Date(v)).format("YYYY-MM-DD")}`}});
        upd_data = {...upd_data,...convert_data[0]};
    }

    var stringfun = get_collection['update_policy'];
    var fun = eval("(" + stringfun + ")");
    var sample=await fun();
    var upd = await dynamicSchema(get_collection['collection_name'],db).updateOne({'_id': req.body.id},sample.data==undefined?sample:sample.data);
    if(sample.updatemany==true){
        sample.updatemanyfunc();
    }
    var get_Data = await dynamicSchema(get_collection['collection_name'],db).findOne({'_id': req.body.id});

    req.body.history!=null?updatehistory(req.body.history, req.body.id,get_collection['collection_name']+'-history'):true;

    var response = {room : req.body.room, data : get_Data}
    io.to(req.body.room).emit('update', response);
    res.send(get_Data); 

}
catch(err){
    console.log(err);
}
}

//Delete
const remove = async (req,res,next)=>{
    try{
    var io = req.app.get('socketio');
    var get_collection
    var db = req.body.db
    if(req.body.condition != null){
        get_collection = await staticSchema["tables"].findOne(req.body.condition).lean()
    }
    var get_Data = await dynamicSchema(get_collection['collection_name'],db).deleteOne({'_id': req.body.id})

    var response = {room : req.body.room, data : req.body.id}
    io.to(req.body.room).emit('delete', response);
    res.send(get_Data) 
}
catch(err){
    console.log(err);
}
}

//bulkDelete
const bulk_Delete = async (req,res,next)=>{
try{
    var get_collection
    var db = req.body.db
    if(req.body.condition != null){
        get_collection = await staticSchema["tables"].findOne(req.body.condition).lean()
    }
    var get_Data = await dynamicSchema(get_collection['collection_name'],db).deleteMany({'_id': { $in: req.body.id}})
    var response = {room : req.body.room, data : req.body.id};
    var io = req.app.get('socketio');
    io.to(req.body.room).emit('bulkdelete',response);
    res.send(get_Data) 
}
catch(err){
    console.log(err);
}
}

//import
const importData = async (req,res,next)=>{
    try{
    var io = req.app.get('socketio');
    const file = req.files.file.data.toString();
    const condition = JSON.parse(req.body.condition);
    const json_data = await csvtojson().fromString(file)
    var db = req.body.db
    var get_collection
    if(req.body.condition != null){
        get_collection = await staticSchema["tables"].findOne(condition).lean();
    }
    var importdata = json_data.map(obj => ({ ...obj, ...{Sent_Date: new Date()} }))
    var get_Data = await dynamicSchema(get_collection['collection_name'],db).insertMany(importdata)

    var response = {room : req.body.room, data : get_Data}
    io.to(req.body.room).emit('import', response);
    res.send(get_Data)
}
catch(err){
    console.log(err);
}
}

//History
const versionhistory = async (req,res,next)=>{
    var get_collection;
    var db = req.body.db;
    try{
    if(req.body.condition != null){
        get_collection = await staticSchema["tables"].findOne(req.body.condition).lean();
    }
    var data= await dynamicSchema(get_collection['collection_name']+'-histories','versionhistory').find({ o_id: req.body.id.toString() }, { [req.body.tablecolname]: 1,_id:0 });
    res.send(data[0]);
    
   }
  catch(err){
    console.log(err);
   }

}
const reordercolumn=async (req,res,next)=>{
    try{
        console.log(req.body)
       var data = await staticSchema["tables"].findOne(req.body.condition).lean();
       var updatecol=await staticSchema["tables"].updateOne({'_id': data._id},{$set : {'table_head':req.body.value}});
       res.send(updatecol);
    }
    catch(err){
        console.log(err);
    }
}
const chellcolor=async (req,res,next)=>{
    try{
        var io = req.app.get('socketio');
       var cold="table_head.$."+req.body.col;
       var data = await staticSchema["tables"].findOne(req.body.condition).lean();
       var updatecol=await staticSchema["tables"].updateOne({'_id' : data['_id'], "table_head.field" : req.body.colname},{$set:{[cold] : req.body.value}});
       var responsedata = await staticSchema["tables"].findOne({'_id' : data['_id'],"table_head.field" : req.body.colname},{'table_head.$':1}).lean();
       var response = {room : req.body.room, data : responsedata['table_head'][0]};
       io.to(req.body.room).emit('update', response);
       res.send(response);
    }
    catch(err){
        console.log(err);
    }
}
const getfilter=async (req,res,next)=>{
    try{
        var db= req.query.db;
        var users;
        var get_collection = await staticSchema["tables"].findOne(JSON.parse(req.query.condition)).lean();
        console.log(get_collection);
        if(req.query.conditiondata!=undefined&&req.query.condition!='undefined')
        {
          console.log("jdfssdgdhg")
          users= await model[table].distinct(req.query.filter,JSON.parse(req.query.conditiondata));
        }
        else{
         users=await dynamicSchema(get_collection['collection_name'],db).distinct(req.query.filter);
        }

          let employees = new Array();
          let key = req.query.filter;
          for (var i = 0; i < users.length; i++) {
            employees.push({[key]: users[i]})    
          }
         console.log(employees)
          res.json(employees);
    }
    catch(err){
        console.log(err);
    }
}
const filterdata=async (req,res,next)=>{
    try{
        var filter_data=req.body.data;
       var get_collection = await staticSchema["tables"].findOne(req.body.condition).lean();
       var stringfun = get_collection['filter_policy'];
       console.log(stringfun)
       var fun = eval("(" + stringfun + ")");
       var sample=await fun();
       console.log(sample)
       var data=await dynamicSchema(req.body.collection==null?get_collection['collection_name']:req.body.collection,req.body.db).aggregate(sample);
       console.log(data);
       res.json(data);
    }
    catch(err){
        console.log(err);
    }
}
const viewactiondata=async (req,res,next)=>{
    try{
        var query=JSON.parse(req.query.q);
        var condition = JSON.parse(req.query.c);
        var router=req.query.router;
        var get_collection = await staticSchema["tables"].findOne(condition).lean();
        //read POlicy
        var get_collection1 = await staticSchema["tables"].findOne({router:router}).lean();
        var stringfun = get_collection1['view_action_policy_back'];
        var fun = eval("(" + stringfun + ")");
        var sample=fun();
        var data=await dynamicSchema(get_collection['collection_name'],get_collection['database']).aggregate(sample.query1==undefined?sample:sample.query1);
        if(sample.mutiaggregate==true){
        var get_collection2 = await staticSchema["tables"].findOne({router:sample.query2router}).lean();
        console.log(get_collection2,sample.query2)
        var data1=await dynamicSchema(get_collection2['collection_name'],get_collection2['database']).aggregate(sample.query2);
        res.send({data:data,data1:data1,profile:query});
        }
        else{
        res.send(data);
        }
    
    }
    catch(err){
        console.log(err);
    }
}
const bulk_assign=async (req,res,next)=>{
    try{
        var io = req.app.get('socketio');
        var get_collection= await staticSchema["tables"].findOne({router:req.body.router}).lean();
        var stringfun = get_collection['bulk_crud_policy'];
        var fun = eval("(" + stringfun + ")");
        var sample=fun();
        var backend=sample.backend();
        var get_db= await staticSchema["tables"].findOne({router:backend.router}).lean();
        var get_Data = await dynamicSchema(get_db['collection_name'],get_db.database).insertMany(backend.data);
        var response = {room : backend.roomid, data : get_Data}
        io.to(backend.roomid).emit('import', response);
        res.send(response)
    }
    catch(err){
        console.log(err);
    }
}
var dynamic={viewactiondata,filterdata,getfilter,chellcolor,reordercolumn,get,add_Column,edit_Column,remove_Column,folder_file_save,folder_file_update,folder_file_remove,normal_read,aggregate_read, save, update, remove, bulk_Delete, importData, versionhistory,bulk_assign}
export default dynamic;