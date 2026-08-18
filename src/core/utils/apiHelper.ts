

async function apiHelper(
    endpoint: string,
    method: string = 'GET',
    body: Record<string, any> | null = null
): Promise<any> {

    const baseUrl: string = "http://localhost:8080";
    const fullUrl: string = `${baseUrl}${endpoint}`;
    const requestOptions: RequestInit = {
        method: method, 
        headers: {
            'Content-Type': 'application/json', 

        },
    };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(body);
    } else if (body && method === 'GET') {
        console.warn("Body provided for a GET request. GET requests typically do not support request bodies.");
    }

    try {
        const response: Response = await fetch(fullUrl, requestOptions);
        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }


        console.log("Successfully received data");
        return response; 
    } catch (error: any) {
        console.error("Error connecting to backend:", error.message);
        throw error;
    }
}


async function login(username: string, password: string): Promise<any> {

    const response : Response= await apiHelper(
        `/api/v1/AuthAPI/token?username=${username}&password=${password}`, 
        'POST',                  
    );
    const data: any = await response.json();
    localStorage.setItem("Token", JSON.stringify(data))
    console.log(localStorage.getItem("Token"))
    if (data && typeof data.accessToken === 'string' && data.accessToken !== '') {
            return true;
    }
}


export default {apiHelper, login};