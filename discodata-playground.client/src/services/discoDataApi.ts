// services/apiService.ts
export const API_BASE_URL = ""; // No need for a base URL since we're using Next.js rewrites

// Generic GET request
export async function fetchData(endpoint: string) {
    const response = await fetch(endpoint); // Calls Next.js proxy
    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
}

// Generic POST request
export async function postData(endpoint: string, data : any) {
    console.log(endpoint, data);
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
}
