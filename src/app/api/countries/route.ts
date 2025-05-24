import { NextResponse } from "next/server";
import countriesData from "./countries.json";
import { countryTypes } from "@/types/User";

// Define a type for the keys of countriesData
// type CountryCode = keyof typeof countriesData;

export async function GET() {
  try {
    // Convert the countriesData object to an array of countries
    const countriesArray = Object.entries(countriesData).map(
      ([code, countryData]) => ({
        code,
        ...countryData,
      })
    );

    return NextResponse.json(countriesArray, { status: 200 });
  } catch (error) {
    console.error("Error fetching countries data:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries data" },
      { status: 500 }
    );
  }
}

// Get a specific country by its ISO alpha-2 code
export async function POST(request: Request) {
  try {
    // Get form data instead of JSON
    const formData = await request.formData();
    const countryCode = formData.get("code")?.toString();

    if (!countryCode) {
      return NextResponse.json(
        { error: "Country code is required" },
        { status: 400 }
      );
    }

    // Convert to uppercase to make it case-insensitive
    const normalizedCode = countryCode.toUpperCase();

    // Find the country by normalized code
    const country = Object.entries(countriesData).find(
      ([key]) => key.toUpperCase() === normalizedCode
    );

    if (!country) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    return NextResponse.json(country[1] as unknown as countryTypes, {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching country data:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
