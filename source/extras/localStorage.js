localStorage={
  items:{},
  getItem:function(key){
    return this.items[key];
  },
  setItem:function(key,value){
    this.items[key]=value;
  }
}