import React, {useEffect, useState} from "react";
import GraphView from "./GraphView";

//Used in testing functionality with a local chunk of COVID data
//import data from '../json/opendata.json';

function ShowTableView() {
    const
        [searchInput, setSearchInput] = useState(""),
        [startDate, setStartDate] = useState(""),
        [endDate, setEndDate] = useState(""),
        [data, setData] = useState([]),
        [isLoading, setIsLoading] = useState(true),
        [currentPage, setCurrentPage] = useState(1),
        [itemsPerPage] = useState(10),
        [activeView, setActiveView] = useState("table"); // Track the active view

    useEffect(() => {
        fetch("https://opendata.ecdc.europa.eu/covid19/casedistribution/json/")
            .then((response) => response.json())
            .then((json) => {
                setData(json["records"]);
                setIsLoading(false);
                const earliestDate = json["records"].reduce((earliest, JsonFile) => {
                    const date = new Date(JsonFile["dateRep"]);
                    return date < earliest ? date : earliest;
                }, new Date());
                setStartDate(earliestDate.toISOString().split("T")[0]);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        const earliestDate = data.reduce((earliest, JsonFile) => {
            const date = new Date(JsonFile["dateRep"]);
            return date < earliest ? date : earliest;
        }, new Date());
        setStartDate(earliestDate.toISOString().split("T")[0]);
        setEndDate(new Date().toISOString().split("T")[0]);
    }, [data]);
    const handleFilter = () => {
            const filteredData = data.filter((JsonFile) => {
                    const date = new Date(JsonFile["dateRep"]);
                    return date >= new Date(startDate) && date <= new Date(endDate);
                }),
                filteredCases = filteredData.filter((JsonFile) =>
                    JsonFile["countriesAndTerritories"]
                        .toLowerCase()
                        .includes(searchInput.toLowerCase())
                );
            return filteredCases.reduce((acc, JsonFile) => {
                if (acc[JsonFile["countriesAndTerritories"]]) {
                    acc[JsonFile["countriesAndTerritories"]].cases += JsonFile.cases;
                    acc[JsonFile["countriesAndTerritories"]].deaths += JsonFile.deaths;
                } else {
                    acc[JsonFile["countriesAndTerritories"]] = {
                        cases: JsonFile.cases,
                        deaths: JsonFile.deaths,
                        population: JsonFile["popData2019"],
                    };
                }
                return acc;
            }, {});
        },
        filteredCountryData = handleFilter(),
        noEntriesMessage =
            Object.keys(filteredCountryData).length === 0
                ? "All of the entries have been filtered out"
                : null,
        sumCasesInSelectedPeriod = Object.entries(filteredCountryData).reduce(
            (acc, [country, { cases }]) => {
                return { ...acc, [country]: cases };
            },
            {}
        ),
        sumDeathsInSelectedPeriod = Object.entries(filteredCountryData).reduce(
            (acc, [country, { deaths }]) => {
                return { ...acc, [country]: deaths };
            },
            {}
        ),
        indexOfLastItem = currentPage * itemsPerPage,
        indexOfFirstItem = indexOfLastItem - itemsPerPage,
        currentItems = Object.entries(filteredCountryData).slice(
            indexOfFirstItem,
            indexOfLastItem
        ),
        totalPages = Math.ceil(
            Object.keys(filteredCountryData).length / itemsPerPage
        ),
        paginate = (pageNumber) => setCurrentPage(pageNumber),
        handleViewChange = (view) => {
            setActiveView(view);
        };

    return (
        <div>
            <div className="button-container-views container">
                <button
                    onClick={() => handleViewChange("table")}
                    disabled={activeView === "table"}
                >
                    Table View
                </button>
                <button
                    onClick={() => handleViewChange("graph")}
                    disabled={activeView === "graph"}
                >
                    Graph View
                </button>
            </div>
            {activeView === "table" ? (
                <div>
                    <div className="grid">
                        <input
                            type="text"
                            id="SearchBox"
                            placeholder="Search by country"
                            value={searchInput}
                            onChange={(SearchBoxEvent) =>
                                setSearchInput(SearchBoxEvent.target.value)
                            }
                        />
                        <input
                            type="date"
                            id="StartDate"
                            value={startDate}
                            onChange={(startDateInput) =>
                                setStartDate(startDateInput.target.value)
                            }
                        />
                        <input
                            type="date"
                            id="EndDate"
                            value={endDate}
                            onChange={(endDateInput) => setEndDate(endDateInput.target.value)}
                        />
                    </div>
                    {isLoading ? (
                        <h1 aria-busy="true">
                            Please wait while the COVID data is being fetched
                        </h1>
                    ) : (
                        <div className="w-auto h-auto">
                            <table role="grid">
                                <thead>
                                <tr>
                                    <th>Country</th>
                                    <th>Total infection cases</th>
                                    <th>Total deaths</th>
                                    <th>Sum of cases in selected period</th>
                                    <th>Sum of deaths in selected period</th>
                                    <th>Infection cases per 1000 citizens</th>
                                    <th>Deaths per 1000 citizens</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentItems.map(
                                    ([country, { cases, deaths, population }]) => (
                                        <tr key={country}>
                                            <td>{country}</td>
                                            <td>{cases}</td>
                                            <td>{deaths}</td>
                                            <td>{sumCasesInSelectedPeriod[country]}</td>
                                            <td>{sumDeathsInSelectedPeriod[country]}</td>
                                            <td>{(cases / (population / 1000)).toFixed(2)}</td>
                                            <td>{(deaths / (population / 1000)).toFixed(2)}</td>
                                        </tr>
                                    )
                                )}
                                {noEntriesMessage && (
                                    <tr>
                                        <td colSpan={7}>{noEntriesMessage}</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="pagination-container">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index + 1}
                                onClick={() => paginate(index + 1)}
                                disabled={index + 1 === currentPage}
                            >
                                {index + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            ) : (
                <GraphView
                    data={data}
                    filteredCountryData={filteredCountryData}
                    startDate={startDate}
                    endDate={endDate}
                />
            )}
        </div>
    );
}

export default ShowTableView;
