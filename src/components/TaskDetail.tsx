                  className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">
                          Data fine
                        </label>
                        <input
                          type="datetime-local"
                          value={
                            editingDataFine
                              ? editingDataFine.toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            setEditingDataFine(
                              e.target.value ? new Date(e.target.value) : null
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateComment}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        Salva
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="bg-gray-300 px-3 py-1 rounded-lg text-sm"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-800">{c.commento}</p>
                    {c.oreDedicate !== undefined && c.oreDedicate > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ore dedicate: {c.oreDedicate}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            <MessageSquare className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p>Nessun commento presente</p>
          </div>
        )}
      </div>

      {/* Allegati */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Paperclip className="h-5 w-5 mr-2 text-blue-600" /> Allegati (
            {allegati.length})
          </h3>
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" /> <span>Carica allegato</span>
          </button>
        </div>

        {showUploadForm && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900">
                Carica nuovo allegato
              </h4>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-blue-700 mt-2">
              Supportati: immagini (JPG, PNG, GIF, WebP), PDF, Word, Excel,
              PowerPoint, testo (max 10MB)
            </p>
          </div>
        )}

        {/* Immagini */}
        {immagini.length > 0 && (
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <Image className="h-5 w-5 mr-2 text-blue-600" /> Immagini (
              {immagini.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {immagini.map((allegato) => (
                <div
                  key={allegato.id}
                  className="relative group rounded-xl overflow-hidden border border-gray-200"
                >
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={allegato.allegato}
                      alt={`Allegato ${allegato.id}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 transform group-hover:scale-105"
                      onClick={() => setPreviewImage(allegato.allegato)}
                    />
                  </div>
                  <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => downloadAllegato(allegato)}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                      title="Scarica immagine"
                    >
                      <Download className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteAllegato(allegato.id!)}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                      title="Elimina immagine"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                  <div className="p-3 bg-white border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Immagine #{allegato.id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documenti */}
        {documenti.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" /> Documenti (
              {documenti.length})
            </h4>
            <div className="space-y-3">
              {documenti.map((allegato) => (
                <div
                  key={allegato.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(allegato)}
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {getFileTypeLabel(allegato)} #{allegato.id}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadAllegato(allegato)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Scarica documento"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAllegato(allegato.id!)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Elimina documento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allegati.length === 0 && !showUploadForm && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Paperclip className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="mb-2">Nessun allegato presente</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Carica il primo allegato
            </button>
          </div>
        )}
      </div>

      {/* Modal Conferma */}
      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={closeConfirmModal}
        />
      )}

      {/* Preview Immagine */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-full max-w-full">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-full max-w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;