import React, { useState } from "react";
import valid from "card-validator";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";  

const CardValidation = () => {
  const [cardNumbers, setCardNumbers] = useState("");
  const [validationResults, setValidationResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const itemsPerPage = 100;

  function luhnCheck(cardNumber) {
    let sum = 0;
    let shouldDouble = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  const validateInChunks = async (numbers) => {
    const chunkSize = 10000;
    const chunks = [];
    for (let i = 0; i < numbers.length; i += chunkSize) {
      const chunk = numbers.slice(i, i + chunkSize);
      const results = chunk.map((cardNumber) => {
        const numberValidation = valid.number(cardNumber);
        if (!numberValidation.isPotentiallyValid || !luhnCheck(cardNumber)) {
          return { cardNumber, status: "Invalid", cardType: "N/A" };
        } else if (numberValidation.card) {
          return {
            cardNumber,
            status: "Valid",
            cardType: numberValidation.card.type,
          };
        } else {
          return { cardNumber, status: "Unknown", cardType: "N/A" };
        }
      });
      chunks.push(...results);
      await new Promise((resolve) => setTimeout(resolve, 0)); // Allow UI to update
    }
    setValidationResults(chunks);
  };

  const validateCardNumbers = () => {
    if (!cardNumbers.trim()) {
      setError("Please enter card details");
      setValidationResults([]);
      return;
    }
    setError("");
    const numbers = cardNumbers.split(",").map((num) => num.trim());
    validateInChunks(numbers);
    setCurrentPage(1);
  };

  const downloadCSV = (status) => {
    const filteredData = validationResults.filter(
      (result) => result.status === status
    );
    const csvRows = [
      ["Card Number", "Status", "Card Type"],
      ...filteredData.map((result) => [
        result.cardNumber,
        result.status,
        result.cardType,
      ]),
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${status}_cards.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadXLSX = (status) => {
    const filteredData = validationResults.filter(
      (result) => result.status === status
    );
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cards");
    XLSX.writeFile(workbook, `${status}_cards.xlsx`);
  };

  const downloadPDF = (status) => {
    const filteredData = validationResults.filter(
      (result) => result.status === status
    );
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Card Validation Results - ${status}`, 14, 16);

    const headers = [["Card Number", "Status", "Card Type"]];
    const rows = filteredData.map((result) => [
      result.cardNumber,
      result.status,
      result.cardType,
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
      theme: "grid",
    });

    doc.save(`${status}_cards.pdf`);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResults = validationResults.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const nextPage = () => {
    if (currentPage < Math.ceil(validationResults.length / itemsPerPage)) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };
   const headingStyle = {
     background: "linear-gradient(to right, pink, blue)",
     WebkitBackgroundClip: "text",
     WebkitTextFillColor: "transparent",
     fontSize: "2rem",  
     textAlign: "center",  
   };
  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "auto",
        textAlign: "center",
      }}
    >
      <h2 style={headingStyle}>Card Validator</h2>

      <textarea
        placeholder="Enter card numbers, separated by commas"
        value={cardNumbers}
        onChange={(e) => setCardNumbers(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          margin: "10px 0",
          borderRadius: "5px",
          border: "1px solid #ccc",
          fontSize: "16px",
          height: "100px",
          resize: "none",
          overflowY: "scroll",
          overflowX: "scroll",
        }}
      />
      {error && (
        <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>
          {error}
        </div>
      )}
      <button
        onClick={validateCardNumbers}
        style={{
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          backgroundColor: "#4CAF50",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Validate Cards
      </button>

      {currentResults.length > 0 && (
        <>
          <table
            style={{
              marginTop: "20px",
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    backgroundColor: "#f2f2f2",
                  }}
                >
                  Card Number
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    backgroundColor: "#f2f2f2",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    backgroundColor: "#f2f2f2",
                  }}
                >
                  Card Type
                </th>
              </tr>
            </thead>
            <tbody>
              {currentResults.map((result, index) => (
                <tr key={index}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {result.cardNumber}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      color: result.status === "Invalid" ? "red" : "green",
                    }}
                  >
                    {result.status}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {result.cardType}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              style={{
                padding: "10px",
                marginRight: "10px",
                border: "none",
                borderRadius: "5px",
                backgroundColor: "#007bff",
                color: "white",
                fontSize: "16px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of{" "}
              {Math.ceil(validationResults.length / itemsPerPage)}
            </span>
            <button
              onClick={nextPage}
              disabled={
                currentPage ===
                Math.ceil(validationResults.length / itemsPerPage)
              }
              style={{
                padding: "10px",
                marginLeft: "10px",
                border: "none",
                borderRadius: "5px",
                backgroundColor: "#007bff",
                color: "white",
                fontSize: "16px",
                cursor:
                  currentPage ===
                  Math.ceil(validationResults.length / itemsPerPage)
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Next
            </button>
          </div>
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={() => downloadCSV("Valid")}
              style={{
                padding: "10px 20px",
                marginRight: "10px",
                borderRadius: "5px",
                backgroundColor: "#28a745",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Download Valid Cards (CSV)
            </button>
            <button
              onClick={() => downloadXLSX("Valid")}
              style={{
                padding: "10px 20px",
                marginRight: "10px",
                borderRadius: "5px",
                backgroundColor: "#17a2b8",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Download Valid Cards (XLSX)
            </button>
            <button
              onClick={() => downloadPDF("Valid")}
              style={{
                padding: "10px 20px",
                borderRadius: "5px",
                backgroundColor: "#ffc107",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Download Valid Cards (PDF)
            </button>
            <br />
            <button
              onClick={() => downloadCSV("Invalid")}
              style={{
                padding: "10px 20px",
                marginTop: "10px",
                marginRight: "10px",
                borderRadius: "5px",
                backgroundColor: "#dc3545",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Download Invalid Cards (CSV)
            </button>
            <button
              onClick={() => downloadXLSX("Invalid")}
              style={{
                padding: "10px 20px",
                marginTop: "10px",
                marginRight: "10px",
                borderRadius: "5px",
                backgroundColor: "#17a2b8",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Download Invalid Cards (XLSX)
            </button>
            <button
              onClick={() => downloadPDF("Invalid")}
              style={{
                padding: "10px 20px",
                marginTop: "10px",
                borderRadius: "5px",
                backgroundColor: "#ffc107",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Download Invalid Cards (PDF)
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CardValidation;
