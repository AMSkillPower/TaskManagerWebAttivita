import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Software } from "../types";
import { apiService } from "../services/api";
import ConfirmModal from "./ConfirmModal";
import { Package, Grid, List, Plus, Edit, Trash2, Search } from "lucide-react";

interface SoftwareManagerProps {
  searchTerm?: string;
}

const SoftwareManager: React.FC<SoftwareManagerProps> = ({
  searchTerm: externalSearchTerm = "",
}) => {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const [showForm, setShowForm] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<Software | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [formData, setFormData] = useState<Omit<Software, "id">>({
    nomeSoftware: "",
    logo: "",
  });

  const taskStats = React.useMemo(() => {
    const stats: Record<number, { total: number; resolved: number }> = {};
    state.software.forEach((software) => {
      const softwareTasks = state.task.filter(
        (task) => task.software === software.nomeSoftware
      );

      stats[software.id] = {
        total: softwareTasks.length,
        resolved: softwareTasks.filter(
          (task) => task.stato?.toLowerCase() === "chiuso"
        ).length,
      };
    });

    return stats;
  }, [state.software, state.task]);

  const getTaskStats = (softwareId: number) => {
    const software = state.software.find((s) => s.id === softwareId);
    if (!software)
      return {
        aperto: 0,
        "in corso": 0,
        chiuso: 0,
        testing: 0,
        "test fallito": 0,
      };

    const softwareTasks = state.task.filter(
      (task) => task.software === software.nomeSoftware
    );

    const stats: Record<string, number> = {
      aperto: 0,
      "in corso": 0,
      chiuso: 0,
      testing: 0,
      "test fallito": 0,
    };

    softwareTasks.forEach((task) => {
      const stato = task.stato?.trim().toLowerCase() || "aperto";
      if (stats.hasOwnProperty(stato)) {
        stats[stato] += 1;
      }
    });

    return stats;
  };

  React.useEffect(() => {
    const fetchSoftware = async () => {
      try {
        const data = await apiService.getSoftware();
        dispatch({
          type: "SET_SOFTWARE",
          payload: data,
        });
      } catch (error) {
        console.error("❌ Errore nel caricamento software:", error);
      }
    };

    fetchSoftware();
  }, []);

  const filteredSoftware =
    Array.isArray(state.software) && state.software.length > 0
      ? state.software.filter((software) =>
          (software?.nomeSoftware ?? "")
            .toLowerCase()
            .includes((searchTerm ?? "").toLowerCase())
        )
      : [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Il file è troppo grande. Massimo 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData((prev) => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingSoftware) {
        const updatedSoftware = await apiService.updateSoftware(
          editingSoftware.id,
          formData
        );
        dispatch({
          type: "UPDATE_SOFTWARE",
          payload: updatedSoftware,
        });
      } else {
        const payload: Omit<Software, "id"> = {
          nomeSoftware: formData.nomeSoftware,
          logo: formData.logo,
        };

        const newSoftware = await apiService.createSoftware(payload);

        dispatch({
          type: "ADD_SOFTWARE",
          payload: newSoftware,
        });
      }
      resetForm();
    } catch (error) {
      alert(`Errore: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nomeSoftware: "",
      logo: "",
    });
    setEditingSoftware(null);
    setShowForm(false);
  };

  const handleEdit = (software: Software) => {
    setFormData({
      nomeSoftware: software.nomeSoftware,
      logo: software.logo || "",
    });
    setEditingSoftware(software);
    setShowForm(true);
  };

  const handleDelete = (id: number, nomeSoftware: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Conferma Eliminazione",
      message: `Sei sicuro di voler eliminare il software "${nomeSoftware}"?`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await apiService.deleteSoftware(id);
          dispatch({ type: "DELETE_SOFTWARE", payload: id });
        } catch (error) {
          alert(`Errore: ${(error as Error).message}`);
        } finally {
          setLoading(false);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const handleSoftwareClick = (software: Software) => {
    console.log("Click su software:", software.nomeSoftware);
    window.dispatchEvent(
      new CustomEvent("navigateWithSearch", {
        detail: {
          page: "task",
          searchTerm: `software:${software.nomeSoftware}`,
        },
      })
    );
  };

  // Funzione per ottenere il colore in base allo stato
  const getStatusColor = (status: string) => {
    switch (status) {
      case "aperto":
        return "bg-red-100 text-red-800";
      case "in corso":
        return "bg-blue-100 text-blue-800";
      case "chiuso":
        return "bg-green-100 text-green-800";
      case "testing":
        return "bg-yellow-100 text-yellow-800";
      case "test fallito":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Gestione Software
          </h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Gestisci il catalogo software
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "cards"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-600"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-600"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm lg:text-base disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Nuovo Software</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca software per nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg lg:text-xl font-bold mb-4">
              {editingSoftware ? "Modifica Software" : "Nuovo Software"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Software *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomeSoftware}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeSoftware: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  />
                  {formData.logo && (
                    <div className="flex items-center space-x-2">
                      <img
                        src={formData.logo}
                        alt="Logo preview"
                        className="h-12 w-12 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: "" })}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Rimuovi
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm lg:text-base disabled:opacity-50"
                >
                  {loading
                    ? "Salvataggio..."
                    : editingSoftware
                    ? "Aggiorna"
                    : "Salva"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200 text-sm lg:text-base disabled:opacity-50"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Software Grid */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredSoftware.map((software) => {
            const stats = getTaskStats(software.id);
            return (
              <div
                key={software.id}
                onClick={() => handleSoftwareClick(software)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                      {software.logo ? (
                        <img
                          src={software.logo}
                          alt={software.nomeSoftware}
                          className="h-6 w-6 lg:h-8 lg:w-8 object-cover rounded"
                        />
                      ) : (
                        <Package className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
                        {software.nomeSoftware}
                      </h3>
                    </div>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(software);
                      }}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(software.id, software.nomeSoftware);
                      }}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Statistiche in linea con colori */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {Object.entries(stats).map(
                    ([stato, count]) =>
                      count > 0 && (
                        <span
                          key={stato}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            stato
                          )}`}
                        >
                          {stato}: {count}
                        </span>
                      )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Software
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statistiche Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSoftware.map((software) => {
                  const stats = getTaskStats(software.id);
                  return (
                    <tr
                      key={software.id}
                      onClick={() => handleSoftwareClick(software)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="bg-green-100 rounded-lg p-2">
                              {software.logo ? (
                                <img
                                  src={software.logo}
                                  alt={software.nomeSoftware}
                                  className="h-6 w-6 object-cover rounded"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {software.nomeSoftware}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(stats).map(
                            ([stato, count]) =>
                              count > 0 && (
                                <span
                                  key={stato}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                    stato
                                  )}`}
                                >
                                  {stato}: {count}
                                </span>
                              )
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(software);
                            }}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(software.id, software.nomeSoftware);
                            }}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredSoftware.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nessun software trovato</p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type="danger"
      />
    </div>
  );
};

export default SoftwareManager;
