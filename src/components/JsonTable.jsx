import React, {useEffect, useState} from 'react';

//Used in testing functionality with a local chunk of COVID data
//import data from '../json/opendata.json';

import {Button, Pagination, Table} from 'react-bootstrap';

function ShowJsonTable() {
    const [searchInput, setSearchInput] = useState(''), [startDate, setStartDate] = useState(''), [endDate, setEndDate] = useState(''), [data, setData] = useState([]), [isLoading, setIsLoading] = useState(true), [currentPage, setCurrentPage] = useState(1), [itemsPerPage] = useState(10);

    //Before executing the rest of the component, loads the remote JSON file
    //After the file is loaded, looks for the earliest date in the records
    //Date is used for by-date filtering
    useEffect(() => {
        fetch('https://opendata.ecdc.europa.eu/covid19/casedistribution/json/')
            .then((response) => response.json())
            .then((json) => {
                setData(json["records"]);
                setIsLoading(false);
                const earliestDate = json["records"].reduce((earliest, JsonFile) => {
                    const date = new Date(JsonFile["dateRep"]);
                    return date < earliest ? date : earliest;
                }, new Date());
                setStartDate(earliestDate.toISOString().split('T')[0]);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            });
    }, []);

    //Sets the filter's earliest date to one fetched before
    useEffect(() => {
        const earliestDate = data.reduce((earliest, JsonFile) => {
            const date = new Date(JsonFile["dateRep"]);
            return date < earliest ? date : earliest;
        }, new Date());

        setStartDate(earliestDate.toISOString().split('T')[0]);
        setEndDate(new Date().toISOString().split('T')[0]);
    }, [data]);

    const handleSearch = () =>
        {
            setSearchInput(searchInput);
        },
        handleFilter = () =>
        {
            // Filter the cases only in-between the selected dates
            const filteredData = data.filter((JsonFile) => {
                const date = new Date(JsonFile["dateRep"]);
                return date >= new Date(startDate) && date <= new Date(endDate);
            });

            // Perform further filtering based on search term
            const filteredCases = filteredData.filter((JsonFile) =>
                JsonFile['countriesAndTerritories'].toLowerCase().includes(searchInput.toLowerCase())
            );

            // Calculate country data for filtered cases
            return filteredCases.reduce((acc, JsonFile) => {
                if (acc[JsonFile['countriesAndTerritories']]) {
                    acc[JsonFile['countriesAndTerritories']].cases += JsonFile.cases;
                    acc[JsonFile['countriesAndTerritories']].deaths += JsonFile.deaths;
                }
                else
                {
                    acc[JsonFile['countriesAndTerritories']] = {
                        cases: JsonFile.cases,
                        deaths: JsonFile.deaths,
                        population: JsonFile['popData2019'],
                    };
                }
                return acc;
            }, {});
        },
        filteredCountryData = handleFilter(), noEntriesMessage =
            Object.keys(filteredCountryData).length === 0 ?
            'All of the entries have been filtered out' : null,

        sumCasesInSelectedPeriod = Object.entries(filteredCountryData).reduce(
            (acc, [country, {cases}]) => {
                return {...acc, [country]: cases};
            },
            {}
        ), sumDeathsInSelectedPeriod = Object.entries(filteredCountryData).reduce(
            (acc, [country, {deaths}]) => {
                return {...acc, [country]: deaths};
            },
            {}
        ),

        indexOfLastItem = currentPage * itemsPerPage, indexOfFirstItem = indexOfLastItem - itemsPerPage,
        currentItems = Object.entries(filteredCountryData).slice(indexOfFirstItem, indexOfLastItem),
        totalPages = Math.ceil(Object.keys(filteredCountryData).length / itemsPerPage),
        paginate = (pageNumber) => setCurrentPage(pageNumber);


    return <div>
        <input
            type="text"
            id="SearchBox"
            placeholder="Search by country"
            value={searchInput}
            onChange={(SearchBoxEvent) =>
                setSearchInput(SearchBoxEvent.target.value)}
        />
        <input
            type="date"
            id="StartDate"
            value={startDate}
            onChange={(startDateInput) =>
                setStartDate(startDateInput.target.value)}
        />
        <input
            type="date"
            id="EndDate"
            value={endDate}
            onChange={(endDateInput) =>
                setEndDate(endDateInput.target.value)}
        />
       <Button
           type="button"
           variant="primary"
           onClick={handleSearch}>
           Search
       </Button>
       <Button
           variant="primary"
           onClick={handleFilter}>
           Filter
       </Button>
        {
            // Shows a loading message while the JSON file is being fetched
            isLoading ? (<h1>Please wait while the COVID data is being fetched</h1>) :
            (
            // Renders the table with the data
            <Table>
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

                {currentItems.map(([country, { cases, deaths, population }]) => (
                    <tr key={country}>
                        <td>{country}</td>
                        <td>{cases}</td>
                        <td>{deaths}</td>
                        <td>{sumCasesInSelectedPeriod[country]}</td>
                        <td>{sumDeathsInSelectedPeriod[country]}</td>
                        <td>{(cases / (population / 1000)).toFixed(2)}</td>
                        <td>{(deaths / (population / 1000)).toFixed(2)}</td>
                    </tr>
                ))}
                {
                    // Shows a warning message if filter has filtered out all of the entries
                    noEntriesMessage &&
                    (
                    <tr><td colSpan={7}>{noEntriesMessage}</td></tr>
                    )
                }
                </tbody>
            </Table>
        )}
        <Pagination>
            {Array.from({ length: totalPages }, (_, index) => (
                <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => paginate(index + 1)}
                >
                    {index + 1}
                </Pagination.Item>
            ))}
        </Pagination>
    </div>
}

export default ShowJsonTable;