import React, {useState} from "react";
import {CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis,} from "recharts";

function GraphView({ data, filteredCountryData, startDate, endDate }) {
    const [selectedCountry, setSelectedCountry] = useState(""),
        handleCountryChange = (event) => {
            setSelectedCountry(event.target.value);
        },
        countryData = data.filter(
            (JsonFile) => JsonFile["countriesAndTerritories"] === selectedCountry
        ),
        graphData = countryData.map((JsonFile) => ({
            date: JsonFile["dateRep"],
            cases: JsonFile["cases"],
            deaths: JsonFile["deaths"],
        }));

    return (
        <div className="container">
            <h2>Graph View</h2>
            <p>Start Date: {startDate}</p>
            <p>End Date: {endDate}</p>

            <select value={selectedCountry} onChange={handleCountryChange}>
                <option value="">Select a country</option>
                {Object.keys(filteredCountryData).map((country) => (
                    <option key={country} value={country}>
                        {country}
                    </option>
                ))}
            </select>

            <div style={{ display: "flex", justifyContent: "center" }}>
                {selectedCountry && (
                    <LineChart width={800} height={400} data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="cases"
                            stroke="#8884d8"
                            dot={false}
                            smooth={true}
                        />
                        <Line
                            type="monotone"
                            dataKey="deaths"
                            stroke="#82ca9d"
                            dot={false}
                            smooth={true}
                        />
                    </LineChart>
                )}
            </div>
        </div>
    );
}

export default GraphView;
