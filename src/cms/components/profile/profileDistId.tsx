
const distIdCommaSeparate=()=>{
    const profile = JSON.parse(localStorage.getItem("profile") ?? "[]" );
      const distId = Array.isArray(profile?.distIdLists)
        ? profile?.distIdLists.join(',') 
        : profile?.distIdLists;
    return distId
}

export default distIdCommaSeparate